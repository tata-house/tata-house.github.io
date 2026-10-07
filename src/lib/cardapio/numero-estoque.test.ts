import { describe, expect, it } from 'vitest';
import { interpretarNumeroEstoque, textoNumeroEstoque } from './numero-estoque';

describe('número de estoque', () => {
  it('não transforma vazio temporário em zero', () => {
    expect(interpretarNumeroEstoque('')).toBeNull();
    expect(interpretarNumeroEstoque('   ')).toBeNull();
  });

  it('aceita zero explícito e números decimais', () => {
    expect(interpretarNumeroEstoque('0')).toBe(0);
    expect(interpretarNumeroEstoque('18')).toBe(18);
    expect(interpretarNumeroEstoque('2,5')).toBe(2.5);
    expect(textoNumeroEstoque(2.5)).toBe('2,5');
  });

  it('rejeita número negativo ou inválido', () => {
    expect(interpretarNumeroEstoque('-1')).toBeNull();
    expect(interpretarNumeroEstoque('abc')).toBeNull();
  });
});
