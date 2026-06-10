export function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: (string | number | null)[][]) {
  const escapar = (v: string | number | null) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // separador ; e BOM para abrir corretamente no Excel brasileiro
  const conteudo =
    '﻿' + [cabecalho, ...linhas].map((linha) => linha.map(escapar).join(';')).join('\r\n');
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}
