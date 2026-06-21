'use client';

/* =====================================================================
   Leitura de nota fiscal por foto — Groq Vision (llama-3.2-90b).
   A chave é passada pelo chamador (nunca hardcoded nem em env vars).
   ===================================================================== */

export interface ItemNotaExtraido {
  produto: string;
  qtd: number;
  unid: string;
  precoUnit: number;
  precoTotal: number;
}

export interface ResultadoLeituraNF {
  fornecedor?: string;
  cnpj?: string;
  data?: string;
  itens: ItemNotaExtraido[];
  totalNF?: number;
  erro?: string;
}

const GROQ_VISION_MODELO = 'llama-3.2-90b-vision-preview';

const PROMPT_NF = `Você é um sistema OCR especializado em notas fiscais brasileiras (NF-e, Cupom Fiscal, NF de produtor rural).
Extraia os dados estruturados da imagem e retorne APENAS JSON neste formato:
{
  "fornecedor": "nome do fornecedor ou emitente",
  "cnpj": "XX.XXX.XXX/XXXX-XX ou CPF",
  "data": "yyyy-mm-dd",
  "totalNF": 0.00,
  "itens": [
    { "produto": "nome do produto conforme NF", "qtd": 0.0, "unid": "KG|UN|L|CX|PCT|SC|FD", "precoUnit": 0.00, "precoTotal": 0.00 }
  ]
}
Regras:
- Normalize unidades: quilograma → KG, unidade/peça → UN, litro → L, caixa → CX, pacote → PCT, saco → SC, fardo → FD.
- Se a unidade for g (gramas), converta para KG dividindo quantidade e preço unitário por 1000.
- Preserve o nome do produto exatamente como aparece na NF para rastreabilidade.
- Se não conseguir ler um campo, omita-o (não invente).
- Retorne apenas o JSON, sem explicações nem markdown.`;

export async function lerNotaFiscalViaIA(
  base64: string,
  mimeType: string,
  groqKey: string,
): Promise<ResultadoLeituraNF> {
  if (!groqKey?.trim()) {
    return { itens: [], erro: 'Chave Groq não configurada. Configure em Cotação → IA Groq.' };
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODELO,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: 'text',
                text: PROMPT_NF,
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    if (!res.ok) {
      const corpo = await res.text().catch(() => res.statusText);
      let mensagem = `Groq ${res.status}: ${corpo}`;
      if (res.status === 401) mensagem = 'Chave Groq inválida. Verifique em console.groq.com/keys.';
      if (res.status === 429) mensagem = 'Limite de requisições atingido. Aguarde um momento.';
      return { itens: [], erro: mensagem };
    }

    const json = await res.json();
    const texto: string = json.choices?.[0]?.message?.content ?? '{}';

    let dados: ResultadoLeituraNF;
    try {
      dados = JSON.parse(texto) as ResultadoLeituraNF;
    } catch {
      const match = texto.match(/\{[\s\S]*\}/);
      dados = match ? (JSON.parse(match[0]) as ResultadoLeituraNF) : { itens: [] };
    }

    return { ...dados, itens: dados.itens ?? [] };
  } catch (e) {
    return { itens: [], erro: String(e) };
  }
}

/** Comprime uma imagem para base64 com limite de qualidade. */
export function comprimirImagem(
  file: File,
  maxWidth = 1600,
  quality = 0.82,
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const dataURL = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataURL.split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = ev.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
