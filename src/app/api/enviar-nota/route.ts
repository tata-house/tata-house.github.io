/* =====================================================================
   API Route — envia nota fiscal + relatório por e-mail.
   Requer: RESEND_API_KEY nas variáveis de ambiente da Vercel.
   Usa a REST API do Resend diretamente (sem SDK npm).
   ===================================================================== */

import { NextRequest, NextResponse } from 'next/server';

const DESTINO = 'compras@tatasushi.com.br';
const RESEND_URL = 'https://api.resend.com/emails';

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { erro: 'RESEND_API_KEY não configurada nas variáveis de ambiente.' },
      { status: 503 },
    );
  }

  let body: {
    fornecedor?: string;
    data?: string;
    responsavel?: string;
    itens?: { produto: string; qtd: number; unid: string; precoUnit: number }[];
    fotoBase64?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Corpo inválido.' }, { status: 400 });
  }

  const { fornecedor, data, responsavel, itens = [], fotoBase64 } = body;

  /* Monta tabela HTML do relatório */
  const tabelaItens =
    itens.length > 0
      ? `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:13px;">
          <thead style="background:#1a5c3a;color:#fff;">
            <tr><th>Produto</th><th>Qtd</th><th>Unid</th><th>R$/unid</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${itens
              .map((i) => {
                const total = i.qtd && i.precoUnit ? (i.qtd * i.precoUnit).toFixed(2) : '—';
                return `<tr>
                  <td>${i.produto}</td>
                  <td align="right">${i.qtd}</td>
                  <td>${i.unid}</td>
                  <td align="right">${i.precoUnit ? `R$ ${i.precoUnit.toFixed(2)}` : '—'}</td>
                  <td align="right">${total !== '—' ? `R$ ${total}` : '—'}</td>
                </tr>`;
              })
              .join('')}
          </tbody>
         </table>`
      : '<p>Nenhum item informado manualmente.</p>';

  const totalGeral =
    itens.length > 0 && itens.every((i) => i.qtd && i.precoUnit)
      ? `R$ ${itens.reduce((s, i) => s + i.qtd * i.precoUnit, 0).toFixed(2)}`
      : '—';

  const html = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;">
      <div style="background:#1a5c3a;padding:24px 32px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Pedido recebido na TATÁ House</h1>
      </div>
      <div style="background:#f9f9f9;padding:24px 32px;border-radius:0 0 8px 8px;">
        <p>Segue em anexo a nota fiscal enviada durante o recebimento, juntamente com o relatório automático do sistema.</p>
        <h2 style="font-size:15px;margin-top:20px;">Relatório automático</h2>
        <table style="font-family:sans-serif;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:4px 12px 4px 0;color:#555;">Fornecedor</td><td><strong>${fornecedor || '—'}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#555;">Data</td><td><strong>${data || new Date().toLocaleDateString('pt-BR')}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#555;">Responsável</td><td><strong>${responsavel || '—'}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#555;">Total geral</td><td><strong>${totalGeral}</strong></td></tr>
        </table>
        <div style="margin-top:16px;">${tabelaItens}</div>
        <hr style="margin:24px 0;border:none;border-top:1px solid #ddd;">
        <p style="color:#888;font-size:11px;">Gerado automaticamente pelo sistema Tatá House em ${new Date().toLocaleString('pt-BR')}.</p>
      </div>
    </div>`;

  /* Anexo: foto da nota (base64 → attachment) */
  const attachments =
    fotoBase64 && fotoBase64.startsWith('data:image/')
      ? [
          {
            filename: `nota-${Date.now()}.jpg`,
            content: fotoBase64.split(',')[1],
          },
        ]
      : [];

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'sistema@tatasushi.com.br';

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Tatá House <${fromEmail}>`,
        to: [DESTINO],
        subject: 'Pedido recebido na TATÁ House',
        html,
        attachments,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ erro: `Resend retornou ${res.status}: ${err}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}
