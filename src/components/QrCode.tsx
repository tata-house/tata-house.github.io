'use client';

/* =====================================================================
   QR code simples para a pesquisa de satisfação do prato do dia.
   Renderiza via serviço de imagem (sem dependência no bundle); o link
   aparece como texto, então funciona mesmo se a imagem não carregar.
   Numa fase futura com Supabase, pode virar um QR gerado localmente.
   ===================================================================== */

export function QrCode({ url, size = 160, className = '' }: { url: string; size?: number; className?: string }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&qzone=1&data=${encodeURIComponent(url)}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={size}
      height={size}
      alt="QR code para avaliar o prato do dia"
      className={`rounded-lg bg-white ${className}`}
    />
  );
}
