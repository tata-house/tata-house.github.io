import { describe, it, expect } from 'vitest';
import { parsearCotacao, ehRemetenteInterno, bloquearRemetente } from './cotacao';

describe('cotação — remetente interno (Erika) não é fornecedor', () => {
  it('ehRemetenteInterno reconhece a Erika em várias grafias', () => {
    expect(ehRemetenteInterno('Erika')).toBe(true);
    expect(ehRemetenteInterno('erika')).toBe(true);
    expect(ehRemetenteInterno('Erika Compras')).toBe(true);
    expect(ehRemetenteInterno('Vita Frango')).toBe(false);
    expect(ehRemetenteInterno('')).toBe(false);
  });

  it('mesmo cadastrada, Erika não é reconhecida como fornecedor', () => {
    const texto = [
      '[10:32] Erika: bom dia, segue a cotação',
      'Frango inteiro 7,00',
    ].join('\n');
    const linhas = parsearCotacao(texto, ['Erika']); // cadastrada por engano
    expect(linhas.length).toBeGreaterThan(0);
    expect(linhas.every((l) => l.marca !== 'Erika')).toBe(true);
  });

  it('encontra o fornecedor REAL no corpo, ignorando quem encaminhou', () => {
    const texto = [
      '[08:15] Erika: encaminhando',
      'Vita Frango',
      'Frango inteiro 7,00',
      'Coxa com sobrecoxa 9,50',
    ].join('\n');
    const linhas = parsearCotacao(texto);
    expect(linhas.length).toBe(2);
    expect(linhas.every((l) => l.marca === 'Vita Frango')).toBe(true);
  });

  it('bloquearRemetente estende a lista em runtime', () => {
    expect(ehRemetenteInterno('Joana')).toBe(false);
    bloquearRemetente('Joana');
    expect(ehRemetenteInterno('Joana')).toBe(true);
  });
});
