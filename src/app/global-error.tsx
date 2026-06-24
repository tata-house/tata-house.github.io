'use client';

/* =====================================================================
   Fronteira de erro RAIZ — captura falhas no próprio layout. Precisa
   renderizar <html>/<body> porque substitui o layout inteiro.
   ===================================================================== */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          padding: '1.5rem',
          textAlign: 'center',
          fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#faf8f4',
          color: '#15171b',
        }}
      >
        <span style={{ fontSize: '3rem' }} aria-hidden>🍵</span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Algo saiu do prato</h1>
        <p style={{ maxWidth: '24rem', fontSize: '0.875rem', color: '#565c66', margin: 0 }}>
          Tivemos um tropeço ao iniciar o app. Seus dados estão salvos — tente de novo.
        </p>
        <button
          onClick={reset}
          style={{
            minHeight: 48,
            borderRadius: '1rem',
            border: 0,
            background: '#007638',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
