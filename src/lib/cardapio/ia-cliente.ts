/* =====================================================================
   IA client-side — chama um LLM diretamente do browser.
   Substitui a API Route /api/ia, permitindo hospedagem estática.

   Provedores suportados (em ordem de prioridade), configure UM:
     NEXT_PUBLIC_GEMINI_API_KEY     → Google Gemini (gratuito, recomendado)
                                       chave do AI Studio (formato AIza... ou AQ...)
                                       enviada no header x-goog-api-key
     NEXT_PUBLIC_OPENAI_API_KEY     → OpenAI (pago)
     NEXT_PUBLIC_ANTHROPIC_API_KEY  → Anthropic (pago)

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

/* ------------------------------------------------------------------ */
/* Extração estruturada de conversas                                    */
/* ------------------------------------------------------------------ */

const SYSTEM_RESTRICOES = `Analise esta conversa e extraia restrições alimentares de funcionários.
Retorne SOMENTE JSON (array, mesmo que vazio):
[{ "nome": "Nome", "setor": "setor ou null", "turno": "almoco|jantar|ambos",
   "restricoes": [{ "tipo": "alergia|preferencia|religioso", "alimento": "alimento", "obs": "obs ou null" }] }]
Tipos: alergia=médica/intolerância, preferencia=pessoal/não gosta, religioso=halal/kosher/crença.
Turno padrão: "almoco". Retorne [] se nada encontrado. Não invente.`;

export async function extrairRestricoesDaConversa(
  texto: string,
): Promise<{ nome: string; setor: string | null; turno: string; restricoes: { tipo: string; alimento: string; obs: string | null }[] }[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_RESTRICOES }] },
          contents: [{ parts: [{ text: texto }] }],
          generationConfig: { maxOutputTokens: 2000, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
        }),
      },
    );
    if (!res.ok) return [];  // silencioso — chamado em background
    const json = await res.json();
    const txt: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    const data = JSON.parse(txt);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Extrai o primeiro objeto JSON de um texto (LLMs às vezes envolvem em prosa). */
function extrairJson(texto: string): RespostaIA {
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) return { texto };
  try {
    return JSON.parse(match[0]) as RespostaIA;
  } catch {
    return { texto };
  }
}

/* ------------------------------------------------------------------ */
/* Google Gemini — gratuito, funciona client-side                       */
/* ------------------------------------------------------------------ */

async function chamarGemini(apiKey: string, prompt: string): Promise<RespostaIA> {
  const modelo = 'gemini-2.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 800,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  );
  if (!res.ok) {
    const corpo = await res.text().catch(() => res.statusText);
    const ehAutenticacao = res.status === 401 || corpo.includes('UNAUTHENTICATED') || corpo.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED');
    throw new Error(ehAutenticacao
      ? 'Chave Gemini inválida — acesse aistudio.google.com/apikey e atualize o secret GEMINI_API_KEY no GitHub com uma chave AIza…'
      : `Gemini ${res.status}: ${corpo}`);
  }
  const json = await res.json();
  const texto = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return extrairJson(texto);
}

/* ------------------------------------------------------------------ */
/* OpenAI                                                               */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Anthropic                                                            */
/* ------------------------------------------------------------------ */

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
  return extrairJson(texto);
}

/* ------------------------------------------------------------------ */
/* Seleção do provedor                                                  */
/* ------------------------------------------------------------------ */

export async function chamarIACliente(
  tarefa: string,
  dossie: DossieIA,
  modo: ModoIA = 'pergunta',
): Promise<RespostaIA> {
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

  if (!geminiKey && !openaiKey && !anthropicKey) {
    return { offline: true, texto: '' };
  }

  const prompt = promptParaModo(modo, tarefa, dossie);

  try {
    if (geminiKey) return await chamarGemini(geminiKey, prompt);
    if (openaiKey) return await chamarOpenAI(openaiKey, prompt);
    return await chamarAnthropic(anthropicKey!, prompt);
  } catch {
    return { offline: true, texto: '' };
  }
}
