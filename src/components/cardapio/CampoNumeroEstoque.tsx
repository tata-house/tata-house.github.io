'use client';

import { useEffect, useState } from 'react';
import { interpretarNumeroEstoque, textoNumeroEstoque } from '@/lib/cardapio/numero-estoque';

export function CampoNumeroEstoque({
  valor,
  aoConfirmar,
  ariaLabel,
  className,
  disabled = false,
}: {
  valor: number;
  aoConfirmar: (valor: number) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const [rascunho, setRascunho] = useState(() => textoNumeroEstoque(valor));
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (!editando) setRascunho(textoNumeroEstoque(valor));
  }, [valor, editando]);

  const confirmar = () => {
    const numero = interpretarNumeroEstoque(rascunho);
    setEditando(false);
    if (numero === null) {
      setRascunho(textoNumeroEstoque(valor));
      return;
    }
    setRascunho(textoNumeroEstoque(numero));
    if (numero !== valor) aoConfirmar(numero);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={rascunho}
      disabled={disabled}
      onFocus={(e) => {
        setEditando(true);
        e.currentTarget.select();
      }}
      onChange={(e) => setRascunho(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className={className}
    />
  );
}
