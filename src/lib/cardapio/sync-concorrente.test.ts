import { describe, expect, it } from 'vitest';
import { mesclarDocumentoConcorrente, mesclarDocumentoConcorrenteSeguro, mesclarEstoqueConcorrenteSeguro, selecionarBaseConcorrente } from './sync-concorrente';

describe('sync-concorrente', () => {
  it('preserva edicoes simultaneas em itens diferentes do mesmo mapa', () => {
    const base = { arroz: 10, feijao: 8 };
    const local = { arroz: 11, feijao: 8 };
    const remoto = { arroz: 10, feijao: 9 };
    const r = mesclarDocumentoConcorrente(base, local, remoto);
    expect(r.conflitos).toEqual([]);
    expect(r.valor).toEqual({ arroz: 11, feijao: 9 });
  });

  it('preserva exclusao quando o outro lado nao alterou o mesmo campo', () => {
    const r = mesclarDocumentoConcorrente({ a: 1, b: 2 }, { b: 2 }, { a: 1, b: 3 });
    expect(r.conflitos).toEqual([]);
    expect(r.valor).toEqual({ b: 3 });
  });

  it('bloqueia publicacao silenciosa quando o mesmo campo mudou dos dois lados', () => {
    const r = mesclarDocumentoConcorrente({ arroz: 10 }, { arroz: 11 }, { arroz: 12 });
    expect(r.conflitos).toEqual(['arroz']);
    expect(r.valor).toEqual({ arroz: 11 });
  });

  it('une adicoes concorrentes em arrays com id', () => {
    const base = [{ id: '1', nome: 'A' }];
    const local = [...base, { id: '2', nome: 'B' }];
    const remoto = [...base, { id: '3', nome: 'C' }];
    const r = mesclarDocumentoConcorrente(base, local, remoto);
    expect(r.conflitos).toEqual([]);
    expect(r.valor).toEqual([{ id: '1', nome: 'A' }, { id: '2', nome: 'B' }, { id: '3', nome: 'C' }]);
  });

  it('une ofertas diferentes pelo fornecedor', () => {
    const base = [{ fornecedor: 'A', preco: 10 }];
    const local = [...base, { fornecedor: 'B', preco: 9 }];
    const remoto = [...base, { fornecedor: 'C', preco: 8 }];
    const r = mesclarDocumentoConcorrente(base, local, remoto);
    expect(r.conflitos).toEqual([]);
    expect((r.valor as unknown[])).toHaveLength(3);
  });

  it('aceita segunda edicao do mesmo aparelho quando o valor anterior e a base', () => {
    const r = mesclarDocumentoConcorrente(
      { arroz: 11 },
      { arroz: 12 },
      { arroz: 11 },
    );
    expect(r.conflitos).toEqual([]);
    expect(r.valor).toEqual({ arroz: 12 });
  });

  it('bloqueia pendencia herdada divergente quando nao existe base conhecida', () => {
    const r = mesclarDocumentoConcorrenteSeguro(
      false,
      undefined,
      { arroz: 11 },
      { arroz: 12 },
    );
    expect(r.conflitos).toEqual(['(base-desconhecida)']);
    expect(r.valor).toEqual({ arroz: 11 });
  });

  it('libera pendencia sem base quando local e remoto ja sao identicos', () => {
    const r = mesclarDocumentoConcorrenteSeguro(
      false,
      undefined,
      { arroz: 12 },
      { arroz: 12 },
    );
    expect(r.conflitos).toEqual([]);
    expect(r.valor).toEqual({ arroz: 12 });
  });

  it('base atual confirmada vence a base persistida antiga da outbox', () => {
    const b = selecionarBaseConcorrente(true, { arroz: 11 }, { arroz: 10 });
    expect(b).toEqual({ conhecida: true, valor: { arroz: 11 } });
    const r = mesclarDocumentoConcorrenteSeguro(b.conhecida, b.valor, { arroz: 12 }, { arroz: 11 });
    expect(r.conflitos).toEqual([]);
    expect(r.valor).toEqual({ arroz: 12 });
  });

  it('cold-start usa ancestral persistido para colapsar varias edicoes offline', () => {
    const b = selecionarBaseConcorrente(false, undefined, { arroz: 10 });
    expect(b).toEqual({ conhecida: true, valor: { arroz: 10 } });
    const r = mesclarDocumentoConcorrenteSeguro(b.conhecida, b.valor, { arroz: 12 }, { arroz: 10 });
    expect(r.conflitos).toEqual([]);
    expect(r.valor).toEqual({ arroz: 12 });
  });

  it('continua fail-closed quando nao ha ancestral atual nem persistido', () => {
    const b = selecionarBaseConcorrente(false, undefined, undefined);
    expect(b.conhecida).toBe(false);
    const r = mesclarDocumentoConcorrenteSeguro(b.conhecida, b.valor, { arroz: 12 }, { arroz: 10 });
    expect(r.conflitos).toEqual(['(base-desconhecida)']);
  });


  it('estoque não deixa um conflito antigo bloquear os demais itens', () => {
    const base = {
      feijao: { item: 'Feijão', unid: 'kg', qtd: 26, minimo: 22, atualizadoEm: '2026-10-07T18:00:00.000Z' },
      oleo: { item: 'Óleo', unid: 'un', qtd: 35, minimo: 0, atualizadoEm: '2026-10-07T18:00:00.000Z' },
    };
    const local = {
      feijao: { ...base.feijao, qtd: 18, atualizadoEm: '2026-10-07T18:07:43.040Z' },
      oleo: { ...base.oleo, qtd: 17, atualizadoEm: '2026-10-07T18:10:45.772Z' },
    };
    const remoto = {
      feijao: { ...base.feijao, qtd: 0, atualizadoEm: '2026-10-07T18:07:41.303Z' },
      oleo: base.oleo,
    };
    const r = mesclarEstoqueConcorrenteSeguro(true, base, local, remoto);
    expect(r.conflitos).toEqual([]);
    expect((r.valor as typeof local).feijao.qtd).toBe(18);
    expect((r.valor as typeof local).oleo.qtd).toBe(17);
  });

  it('estoque converge mesmo sem base usando a atualização mais nova de cada item', () => {
    const local = {
      feijao: { item: 'Feijão', unid: 'kg', qtd: 18, minimo: 22, atualizadoEm: '2026-10-07T18:07:43.040Z' },
      leite: { item: 'Leite', unid: 'lt', qtd: 11, minimo: 0, atualizadoEm: '2026-10-07T18:09:09.858Z' },
    };
    const remoto = {
      feijao: { item: 'Feijão', unid: 'kg', qtd: 0, minimo: 22, atualizadoEm: '2026-10-07T18:07:41.303Z' },
      oleo: { item: 'Óleo', unid: 'un', qtd: 35, minimo: 0, atualizadoEm: '2026-09-30T14:27:57.808Z' },
    };
    const r = mesclarEstoqueConcorrenteSeguro(false, undefined, local, remoto);
    expect(r.conflitos).toEqual([]);
    expect(r.valor).toEqual({
      feijao: local.feijao,
      leite: local.leite,
      oleo: remoto.oleo,
    });
  });

  it('estoque preserva alterações concorrentes em campos diferentes do mesmo item', () => {
    const base = {
      arroz: { item: 'Arroz', unid: 'kg', qtd: 10, minimo: 5, atualizadoEm: '2026-10-07T10:00:00.000Z' },
    };
    const local = {
      arroz: { ...base.arroz, qtd: 8, atualizadoEm: '2026-10-07T10:01:00.000Z' },
    };
    const remoto = {
      arroz: { ...base.arroz, minimo: 6, atualizadoEm: '2026-10-07T10:02:00.000Z' },
    };
    const r = mesclarEstoqueConcorrenteSeguro(true, base, local, remoto);
    expect(r.conflitos).toEqual([]);
    expect(r.valor).toEqual({
      arroz: { item: 'Arroz', unid: 'kg', qtd: 8, minimo: 6, atualizadoEm: '2026-10-07T10:02:00.000Z' },
    });
  });

  it('estoque resolve o campo conflitante pelo item mais novo sem perder outro campo remoto', () => {
    const base = {
      arroz: { item: 'Arroz', unid: 'kg', qtd: 10, minimo: 5, atualizadoEm: '2026-10-07T10:00:00.000Z' },
    };
    const local = {
      arroz: { ...base.arroz, qtd: 8, atualizadoEm: '2026-10-07T10:03:00.000Z' },
    };
    const remoto = {
      arroz: { ...base.arroz, qtd: 9, minimo: 6, atualizadoEm: '2026-10-07T10:02:00.000Z' },
    };
    const r = mesclarEstoqueConcorrenteSeguro(true, base, local, remoto);
    expect(r.conflitos).toEqual([]);
    expect(r.valor).toEqual({
      arroz: { item: 'Arroz', unid: 'kg', qtd: 8, minimo: 6, atualizadoEm: '2026-10-07T10:03:00.000Z' },
    });
  });

  it('fila online 10 para 11 para 12 usa 11 como base depois do primeiro upload confirmado', () => {
    // Estado comum inicial: 10.
    let baseAtual = { arroz: 10 };

    const primeiraBase = selecionarBaseConcorrente(true, baseAtual, { arroz: 10 });
    const primeira = mesclarDocumentoConcorrenteSeguro(
      primeiraBase.conhecida,
      primeiraBase.valor,
      { arroz: 11 },
      { arroz: 10 },
    );
    expect(primeira.conflitos).toEqual([]);
    expect(primeira.valor).toEqual({ arroz: 11 });

    // Simula exatamente o ponto do BootNuvem APOS o upload de 11 confirmar:
    // a base comum avanca mesmo que a revisao 12 ja esteja enfileirada.
    baseAtual = primeira.valor as { arroz: number };

    const segundaBase = selecionarBaseConcorrente(true, baseAtual, { arroz: 10 });
    const segunda = mesclarDocumentoConcorrenteSeguro(
      segundaBase.conhecida,
      segundaBase.valor,
      { arroz: 12 },
      { arroz: 11 },
    );
    expect(segunda.conflitos).toEqual([]);
    expect(segunda.valor).toEqual({ arroz: 12 });
  });
});
