/* =====================================================================
   IA client-side — chama OpenAI ou Anthropic diretamente do browser.
   Substitui a API Route /api/ia, permitindo hospedagem estática.
   Configure NEXT_PUBLIC_OPENAI_API_KEY ou NEXT_PUBLIC_ANTHROPIC_API_KEY.
   Sem nenhuma key → retorna { offline: true } e o assistente usa regras.
   ===================================================================== */

import type { DossieIA } from './dossie';

export type ModoIA = 'briefing' | 'decisao' | 'alerta' | 'pergunta';

export interface RespostaIA {
  texto: string;
  itens?: string[];
  offline?: boolean;
}

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
      return `Gere um briefing matinal do restaurante para hoje. Destaque o mais urgente em no máximo 3 pontos.\nDOSSIÊ: ${dados}`;
    case 'decisao':
      return `O gestor precisa de uma recomendação. Situação: "${tarefa}"\nAnalise o dossiê e dê UMA recomendação clara com o impacto esperado.\nDOSSIÊ: ${dados}`;
    case 'alerta':
      return `Analise os alertas do dossiê e classifique: qual é o mais urgente e por quê?\nDOSSIÊ: ${dados}`;
    case 'pergunta':
    default:
      return `Pergunta do gestor: "${tarefa}"\nResponda usando SOMENTE os dados do dossiê. Se a pergunta não puder ser respondida com os dados disponíveis, diga que faltam dados.\nDOSSIÊ: ${dados}`;
  }
}

async function chamarOpenAI(apiKey: string, prompt: string): Promise<RespostaIA> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const json = await res.json();
  const conteudo = json.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(conteudo) as RespostaIA;
}

async function chamarAnthropic(apiKey: string, prompt: string): Promise<RespostaIA> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const json = await res.json();
  const texto = json.content?.[0]?.text ?? '{}';
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) return { texto };
  return JSON.parse(match[0]) as RespostaIA;
}

export async function chamarIACliente(
  tarefa: string,
  dossie: DossieIA,
  modo: ModoIA = 'pergunta',
): Promise<RespostaIA> {
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    return { offline: true, texto: '' };
  }

  const prompt = promptParaModo(modo, tarefa, dossie);

  try {
    if (openaiKey) return await chamarOpenAI(openaiKey, prompt);
    return await chamarAnthropic(anthropicKey!, prompt);
  } catch {
    return { offline: true, texto: '' };
  }
}
