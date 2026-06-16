'use client';

export type ToastTipo = 'info' | 'erro' | 'sucesso' | 'alerta';

export function toast(_msg: string, _tipo?: ToastTipo) {
  console.log(`toast [${_tipo ?? 'info'}]:`, _msg);
}

export function ToastHost() {
  return null;
}