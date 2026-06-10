'use client';

import { useEffect, useState } from 'react';

export function AvisoOffline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const aoConectar = () => setOnline(true);
    const aoDesconectar = () => setOnline(false);
    window.addEventListener('online', aoConectar);
    window.addEventListener('offline', aoDesconectar);
    return () => {
      window.removeEventListener('online', aoConectar);
      window.removeEventListener('offline', aoDesconectar);
    };
  }, []);

  if (online) return null;

  return (
    <div className="sticky top-0 z-50 bg-red-600 px-4 py-2 text-center text-sm font-bold text-white print:hidden">
      ⚠️ Sem conexão — os dados podem estar desatualizados. Alterações estão bloqueadas para evitar conflito de mesas.
    </div>
  );
}
