'use client';

/* =====================================================================
   Logo da casa enviado pelo gestor (imagem oficial) — guardado como
   dataURL no localStorage. Assim o pôster usa a marca real, sem depender
   de um desenho aproximado.
   ===================================================================== */

import { useCallback, useEffect, useState } from 'react';

const CHAVE = 'cardapio.v1.logo';

export function useLogo() {
  const [logo, setLogoState] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLogoState(localStorage.getItem(CHAVE));
    } catch {
      /* sem armazenamento */
    }
  }, []);

  const setLogo = useCallback((dataUrl: string | null) => {
    setLogoState(dataUrl);
    try {
      if (dataUrl) localStorage.setItem(CHAVE, dataUrl);
      else localStorage.removeItem(CHAVE);
    } catch {
      /* armazenamento indisponível */
    }
  }, []);

  return { logo, setLogo };
}

/**
 * Lê um arquivo de imagem e devolve um dataURL PNG reduzido (até `max` px no
 * maior lado) — mantém transparência e evita estourar o localStorage.
 */
export function imagemParaDataUrl(file: File, max = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('falha ao ler o arquivo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('imagem inválida'));
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * escala));
        const h = Math.max(1, Math.round(img.height * escala));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas indisponível'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
