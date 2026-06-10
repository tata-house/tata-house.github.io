'use client';

import { useEffect } from 'react';

export function RegistroSw() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // PWA é opcional: falha no registro não impede o uso do app
      });
    }
  }, []);
  return null;
}
