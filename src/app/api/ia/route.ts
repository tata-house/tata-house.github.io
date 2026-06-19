/* =====================================================================
   API Route — /api/ia
   Recebe um dossiê pré-calculado + tarefa e devolve a resposta do LLM.
   Tenta OpenAI primeiro (OPENAI_API_KEY), depois Anthropic
   (ANTHROPIC_API_KEY). Se nenhuma chave estiver configurada, devolve
   { offline: true } para que o cliente use o assistente baseado em regras.

   O system prompt proíbe o LLM de inventar números: ele só analisa e
   explica o que já está no dossiê.
   ===================================================================== */

import { NextRequest, NextResponse } from 'next/server';
import type { DossieIA } from '@/lib/cardapio/dossie';

export type ModoIA = 'briefing' | 'decisao' | 'alerta' | 'pergunta';

export interface PedidoIA {
  tarefa: string;
  dossie: DossieIA;
  modo?: ModoIA;
}

export interface RespostaIA {
  texto: string;
  itens?: string[];
  offline?: boolean;
  erro?: string;
}

/* ------------------------------------------------------------------ */
/* System prompt base                                                   */
/* ------------------------------------------------------------------ */

const SYSTEM = `Você é o assistente operacional do Tatá House, um restaurante corporativo brasileiro.
Você recebe um dossiê com dados reais pré-calculados pelo sistema (custos, estoque, aceitação, etc.).

REGRAS ABSOLUTAS:
1. Nunca invente números. Use APENAS os valores do dossiê fornecido.
2. Responda em português brasileiro, de forma direta e prática.
3. Limite sua resposta a no máximo 4 frases ou 5 itens de lista — seja conciso.
4. Quando houver dados insuficientes, diga claramente que faltam dados.
5. Foque em ações concretas que o gestor pode tomar hoje.

Formato de resposta: JSON com { "texto": "...", "itens": ["...", "..."] }
O campo "itens" é opcional — use só quando listar claramente melhora a leitura.`;

function promptParaModo(modo: ModoIA, tarefa: string, dossie: DossieIA): string {
  const dados = JSON.stringify(dossie, null, 2);
  switch (modo) {
    case 'briefing':
      return `Gere um briefing matinal do restaurante para hoje. Destaque o mais urgente em no máximo 3 pontos.
DOSSIÊ: ${dados}`;
    case 'decisao':
      return `O gestor precisa de uma recomendação. Situação: "${tarefa}"
Analise o dossiê e dê UMA recomendação clara com o impacto esperado.
DOSSIÊ: ${dados}`;
    case 'alerta':
      return `Analise os alertas do dossiê e classifique: qual é o mais urgente e por quê?
DOSSIÊ: ${dados}`;
    case 'pergunta':
    default:
      return `Pergunta do gestor: "${tarefa}"
Responda usando SOMENTE os dados do dossiê. Se a pergunta não puder ser respondida com os dados disponíveis, diga que faltam dados.
DOSSIÊ: ${dados}`;
  }
}

/* ------------------------------------------------------------------ */
/* Provedores LLM                                                       */
/* ------------------------------------------------------------------ */

async function chamarOpenAI(apiKey: string, system: string, prompt: string): Promise<RespostaIA> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const conteudo = json.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(conteudo) as RespostaIA;
}

async function chamarAnthropic(apiKey: string, system: string, prompt: string): Promise<RespostaIA> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const texto = json.content?.[0]?.text ?? '{}';
  // Anthropic não garante JSON puro mesmo com instrução — extraímos
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) return { texto };
  return JSON.parse(match[0]) as RespostaIA;
}

/* ------------------------------------------------------------------ */
/* Handler                                                              */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  let body: PedidoIA;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ texto: '', erro: 'Corpo inválido.' } satisfies RespostaIA, { status: 400 });
  }

  const { tarefa, dossie, modo = 'pergunta' } = body;
  if (!tarefa || !dossie) {
    return NextResponse.json({ texto: '', erro: 'Campos "tarefa" e "dossie" são obrigatórios.' } satisfies RespostaIA, { status: 400 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    return NextResponse.json({ offline: true, texto: '' } satisfies RespostaIA);
  }

  const prompt = promptParaModo(modo, tarefa, dossie);

  try {
    if (openaiKey) {
      const resposta = await chamarOpenAI(openaiKey, SYSTEM, prompt);
      return NextResponse.json(resposta);
    }
    const resposta = await chamarAnthropic(anthropicKey!, SYSTEM, prompt);
    return NextResponse.json(resposta);
  } catch (e) {
    // LLM falhou — cliente vai usar o fallback baseado em regras
    console.error('[/api/ia]', e);
    return NextResponse.json({ offline: true, texto: '', erro: String(e) } satisfies RespostaIA);
  }
}
