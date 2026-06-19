/* =====================================================================
   Biblioteca culinária do Tatá House — agregador.

   Une todas as fatias (aves, bovinos, suínos, peixes, completos,
   guarnições, saladas, sobremesas, molhos/vegetarianos) numa única
   biblioteca, deduplica por nome e expõe a API usada pelo motor, pelo
   Chef IA e pelas telas.

   CRESCIMENTO: para ampliar a biblioteca, crie um novo arquivo de fatia
   exportando `PRATOS: Receita[]` e registre-o em FATIAS abaixo. Nada mais
   muda — índices, custo e escala passam a valer automaticamente.
   ===================================================================== */

import type { ItemSugerido } from '../tipos';
import type {
  Receita,
  CategoriaReceita,
  IngredienteReceita,
  ClasseReceita,
  Complexidade,
  NutricaoReceita,
} from './tipos';
import { normReceita, receitaCompleta } from './tipos';

import { PRATOS as AVES } from './aves';
import { PRATOS as BOVINOS } from './bovinos';
import { PRATOS as SUINOS } from './suinos';
import { PRATOS as PEIXES } from './peixes';
import { PRATOS as COMPLETOS } from './completos';
import { PRATOS as GUARNICOES } from './guarnicoes';
import { PRATOS as SALADAS } from './saladas';
import { PRATOS as SOBREMESAS } from './sobremesas';
import { PRATOS as MOLHOS } from './molhos';

export type {
  Receita,
  CategoriaReceita,
  IngredienteReceita,
  ClasseReceita,
  Complexidade,
  NutricaoReceita,
};
export { receitaCompleta } from './tipos';

/** Ordem das fatias — registre novas fatias aqui para crescer a biblioteca. */
const FATIAS: Receita[][] = [
  AVES,
  BOVINOS,
  SUINOS,
  PEIXES,
  COMPLETOS,
  GUARNICOES,
  SALADAS,
  SOBREMESAS,
  MOLHOS,
];

/** Lista única, sem duplicatas (primeira ocorrência por nome normalizado vence). */
export const TODAS_RECEITAS: Receita[] = (() => {
  const vistos = new Set<string>();
  const out: Receita[] = [];
  for (const fatia of FATIAS) {
    for (const r of fatia) {
      const k = normReceita(r.nome);
      if (!k || vistos.has(k)) continue;
      vistos.add(k);
      out.push(r);
    }
  }
  return out.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
})();

/** Índice por nome normalizado. */
export const RECEITAS: Record<string, Receita> = Object.fromEntries(
  TODAS_RECEITAS.map((r) => [normReceita(r.nome), r]),
);

/**
 * Aliases: nomes históricos do Tatá House (variações de grafia, descrições
 * com ingrediente, abreviações) → nome canônico de receita na biblioteca.
 * Permite que receitaDoPrato() resolva 100% dos pratos do histórico.
 */
const ALIASES_RECEITA: Record<string, string> = {
  // ── Frango grelhado / acebolado ────────────────────────────────────────
  'file de frango acebolado':            'Filé de frango grelhado',
  'file de frango grelhado':             'Filé de frango grelhado',
  'file de coxa acebolado':              'Filé de frango grelhado',
  'file de frango':                      'Filé de frango grelhado',
  'file de frango sem osso':             'Filé de frango grelhado',
  'file de frango ao molho madeira':     'Filé de frango ao molho de tomate',
  'file de frango ao molho de tomate (file de coxa)': 'Filé de frango ao molho de tomate',
  'filé de frango ao molho de tomate (filé de coxa)': 'Filé de frango ao molho de tomate',
  'filé de frango em tiras com legumes': 'Frango grelhado com legumes salteados',
  'filé de frango':                      'Filé de frango grelhado',
  'filé de peito de frango grelhado':    'Filé de frango grelhado',
  'tiras de frango refogada':            'Frango desfiado refogado',
  'cubos de frango refogada':            'Cubos de frango ao alho e óleo',
  'frango em cubos ao molho':            'Cubos de frango ao alho e óleo',
  'frango em cubos ao molho de tomate e cebola': 'Filé de frango ao molho de tomate',
  // ── Frango à parmegiana / milanesa ────────────────────────────────────
  'file parmegiana de frango':           'Frango à parmegiana',
  'file a parmegiana de frango':         'Frango à parmegiana',
  'file de frango parmegiana':           'Frango à parmegiana',
  'file de frango a parmegiana':         'Frango à parmegiana',
  'file de frango á parmegiana':         'Frango à parmegiana',
  'parmegiana de frango':                'Frango à parmegiana',
  'file de frango empanado':             'Frango à milanesa',
  'filé de frango empanado':             'Frango à milanesa',
  'file de frango á milanesa':           'Frango à milanesa',
  'filé de frango á milanesa':           'Frango à milanesa',
  // ── Frango pizzaiolo ──────────────────────────────────────────────────
  'file de frango pizzaiolo com manjerica':      'Filé de frango ao molho de tomate',
  'file de frango á pizzaiolo com manjerica':    'Filé de frango ao molho de tomate',
  'file de frango á pizzaiolo com manjerição':   'Filé de frango ao molho de tomate',
  'file de frango pizzaiolo com manjerição':     'Filé de frango ao molho de tomate',
  'file de frango a pizzaiolo':                  'Filé de frango ao molho de tomate',
  'frango a pizzaiolo':                          'Filé de frango ao molho de tomate',
  'frango à pizzaiolo':                          'Filé de frango ao molho de tomate',
  // ── Frango assado / coxa / sobrecoxa ──────────────────────────────────
  'frango assado':                       'Frango assado com batatas',
  'frango assado com batata':            'Frango assado com batatas',
  'frango assado com bacon':             'Frango assado com batatas',
  'frango assado com linguica':          'Frango assado com batatas',
  'coxa assada':                         'Sobrecoxa assada com ervas',
  'coxa e sobre coxa assada':            'Sobrecoxa assada com ervas',
  'coxa e sobrecoxa assada':             'Sobrecoxa assada com ervas',
  'coxa e sobrecoxa':                    'Sobrecoxa assada com ervas',
  'sobre coxa assada':                   'Sobrecoxa assada com ervas',
  'sobrecoxa assada':                    'Sobrecoxa assada com ervas',
  'coxa e sobre coxa com mandioca assada': 'Sobrecoxa assada com ervas',
  // ── Frango cozido / cremoso / desfiado ────────────────────────────────
  'frango cozido':                       'Frango ensopado com legumes',
  'frango cozido com legumes':           'Frango ensopado com legumes',
  'frango jardineira':                   'Frango ensopado com legumes',
  'frango á jardineira':                 'Frango ensopado com legumes',
  'frango cremoso':                      'Frango cremoso com cenoura',
  'frango desfiado':                     'Frango desfiado refogado',
  'frango desfiado com milho':           'Frango com creme de milho',
  'frango grelhado com creme de milho':  'Frango com creme de milho',
  'tiras de frango com bacon':           'Frango assado com batatas',
  'iscas de frango com bacon':           'Frango assado com batatas',
  'file de frango com bacon':            'Frango assado com batatas',
  // ── Frango xadrez / passarinho ────────────────────────────────────────
  ': frango xadrez com brocolis e cenoura': 'Frango xadrez',
  'frango xadrez com brocolis e cenoura':   'Frango xadrez',
  'frango a xadrez com brocolis e cenoura': 'Frango xadrez',
  'frango á passarinho ao molho tartaro':   'Frango à passarinho',
  // ── Fricassê / galinhada ──────────────────────────────────────────────
  'fricasse de frango':                  'Fricassê de frango',
  'sse de frango':                       'Fricassê de frango',
  'galinhada + farofa':                  'Galinhada Caipira',
  // ── Sopa de frango ────────────────────────────────────────────────────
  'sopa cremosa de mandioca com frango com batata e cenoura': 'Frango ensopado com legumes',
  'arroz de forno com frango desfiado e legumes ( frango a parte)': 'Arroz de Forno',
  // ── Bovina: bife ──────────────────────────────────────────────────────
  'bife acebolado (patinho fatiado)':    'Bife acebolado',
  'bife de patinho':                     'Bife acebolado',
  'bife ao molho':                       'Cubos de acém ao molho',
  'bife ao creme de batata':             'Carne com batata',
  // ── Bovina: carne assada / desfiada ───────────────────────────────────
  'carne assada':                        'Carne assada fatiada',
  'carne assada com molho champion':     'Carne assada fatiada',
  'carne desfiada':                      'Carne desfiada ao tomate',
  'carne desfiada acebolada':            'Carne desfiada ao tomate',
  'carne louca':                         'Carne desfiada ao tomate',
  'carreteira de carne desfiada':        'Arroz Carreteiro',
  // ── Bovina: carne moída ───────────────────────────────────────────────
  'carne moida refogada com batata':     'Carne moída refogada',
  'carne moida com legumes':             'Carne com legumes',
  'carne moida com batata doce':         'Carne moída refogada',
  'carne moida a parmegiana':            'Almôndegas ao sugo',
  'carne moida com batata':              'Carne moída refogada',
  'carne moída com batata':              'Carne moída refogada',
  'carne moída com batata doce':         'Carne moída refogada',
  'carne moída refogada com batata':     'Carne moída refogada',
  // ── Bovina: carne de panela / cubos ───────────────────────────────────
  'carne de panela ( aranha)':           'Carne de panela',
  'carne de panela desfiada':            'Carne de panela',
  'carne de panela em cubos com batata': 'Carne com batata',
  'carne de panela com batata':          'Carne com batata',
  'carne de panela com pure de moranga': 'Carne de panela',
  'carne cozida com abobora':            'Carne seca com abóbora',
  'carne em cubos ao molho de tomate':   'Cubos de acém ao molho',
  'carne em cubos ao molho madeira':     'Carne ao molho madeira',
  'carne em cubos com abobora':          'Carne seca com abóbora',
  'carne em cubos ao molho':             'Cubos de acém ao molho',
  'carne em cubos com molho madeira':    'Carne ao molho madeira',
  'tiras de carne ao molho':             'Cubos de acém ao molho',
  'tiras de carnes ao molho madeira':    'Carne ao molho madeira',
  'tiras de carne com cebola caramelizada': 'Iscas de carne acebolada',
  'tiras de carne com cebola e pimentao':   'Cubos de carne com pimentão',
  // ── Bovina: escondidinho / picadinho / strogonoff ─────────────────────
  'escondidinho de carne':               'Escondidinho de Carne Seca',
  'escondidinho de carne moida':         'Escondidinho de Carne Seca',
  'picadinho':                           'Picadinho de carne',
  'picadinho com cenoura':               'Picadinho de carne',
  'picadinho com cenoura e batata':      'Picadinho de carne',
  'picadinho com cenoura e chuchu':      'Picadinho de carne',
  'picadinho com chuchu':                'Picadinho de carne',
  'picadinho com legumes':               'Picadinho de carne',
  'strogonoff de carne':                 'Estrogonofe de carne',
  'sse de carne':                        'Estrogonofe de carne',
  'rabada ao molho':                     'Ensopado de músculo',
  // ── Bovina: costela ───────────────────────────────────────────────────
  'costela bovina':                      'Costela ao molho',
  'costela bovina assada':               'Costela ao molho',
  'costela bovina com batata':           'Carne com batata',
  'costela bovina com mandioca':         'Carne com mandioca',
  'costela bovina no forno com mandioca': 'Carne com mandioca',
  'costela assada com mandioca':         'Carne com mandioca',
  'costela ao molho de barbecue':        'Costela ao molho',
  'costela no forno':                    'Costela ao molho',
  // ── Bovina: churrasco / chuletinha / iscas ────────────────────────────
  'churrasco de panela de pressao':      'Carne de panela',
  'churrasco de panela — mandioca frita': 'Carne de panela',
  'churrasco na panela de pressao':      'Carne de panela',
  'chuletinha paulista na manteiga':     'Bife acebolado',
  'iscas de carne no molho shoyu':       'Iscas de carne acebolada',
  // ── Bovina: almôndegas ────────────────────────────────────────────────
  'almondegas ao molho':                 'Almôndegas ao sugo',
  'almondegas ao molho com manjerição':  'Almôndegas ao sugo',
  'almondegas ao molho de manjerição':   'Almôndegas ao sugo',
  'almondegas ao molho de tomate com manjerição': 'Almôndegas ao sugo',
  'almondegas á parmegiana':             'Almôndegas ao sugo',
  // ── Bovina: macarrão / espaguete ──────────────────────────────────────
  'macarrao com almondega':              'Talharim ao Sugo com Almôndegas',
  'macarrao com molho de almondegas':    'Talharim ao Sugo com Almôndegas',
  'espaguete ao molho de tomate com almondegas': 'Talharim ao Sugo com Almôndegas',
  'macarrao al pesto com desfiado (frango a parte)': 'Macarrão alho e óleo',
  'macarrao ao molho branco (bechamel) com almondegas e a parte frango desfiado': 'Talharim ao Sugo com Almôndegas',
  // ── Suína: lombo ──────────────────────────────────────────────────────
  'lombo suino':                         'Lombo suíno assado fatiado',
  'lombo suíno':                         'Lombo suíno assado fatiado',
  'lombo suino com abacaxi':             'Lombo suíno assado fatiado',
  'lombo suino assado com abacaxi':      'Lombo suíno assado fatiado',
  'lombo suino ao molho barbecue':       'Lombo suíno assado fatiado',
  // ── Suína: costelinha ─────────────────────────────────────────────────
  'costelinha suina acebolado':          'Bisteca suína acebolada',
  'costelinha suina c/ limao na pressao': 'Costelinha suína com mandioca',
  'costelinha suina com barbecue':       'Costelinha suína ao barbecue',
  'costelinha suina na manteiga':        'Bisteca suína acebolada',
  'costelinha com barbacue':             'Costelinha suína ao barbecue',
  'costelinha com barbecue':             'Costelinha suína ao barbecue',
  'costelinha suina/ chuleta bovina':    'Costelinha suína ao barbecue',
  // ── Suína: bisteca ────────────────────────────────────────────────────
  'bisteca de porco':                    'Bisteca suína acebolada',
  'bisteca com barbecue':                'Costelinha suína ao barbecue',
  'bisteca com molho barbecue':          'Costelinha suína ao barbecue',
  'bisteca em tiras no limao':           'Bisteca suína acebolada',
  // ── Suína: pernil ─────────────────────────────────────────────────────
  'pernil assado':                       'Pernil de porco assado',
  'pernil assado com abacaxi':           'Pernil de porco assado',
  'pernil suino assado com molho de limao': 'Pernil de porco assado',
  // ── Suína: linguiça / toscana ─────────────────────────────────────────
  'linguica ao forno':                   'Linguiça toscana com batatas',
  'linguica toscana no forno':           'Linguiça toscana com batatas',
  'linguica toscana no forno com a queijo': 'Linguiça toscana com batatas',
  'linguica toscana assada com batata, cebola e pimentao': 'Linguiça toscana com batatas',
  'linguica toscana acebolada':          'Linguiça toscana acebolada',
  'toscana acebolada':                   'Linguiça toscana acebolada',
  'toscana ao forno com batata':         'Linguiça toscana com batatas',
  'calabresa frita com cebola':          'Linguiça calabresa com pimentões',
  // ── Suína: baião / feijoada / feijão tropeiro / tutu ──────────────────
  'baiao de dois, lombo suino':          'Baião de Dois',
  'feijoada completa com costelinha':    'Feijoada Completa',
  'feijoada com bisteca':                'Feijoada Completa',
  'feijoada com costelinha':             'Feijoada Completa',
  'feijoada com costelinha de porco':    'Feijoada Completa',
  'feijoada com lombo suino':            'Feijoada Completa',
  'feijoada com pernil de porco':        'Feijoada Completa',
  'feijoada com costelinha suina':       'Feijoada Completa',
  'feijoada com lombo de porco':         'Feijoada Completa',
  'feijoada simples com costelinha de porco e bacon': 'Feijoada Completa',
  'feijao tropeiro com bisteca':         'Feijão Tropeiro',
  'feijao tropeiro com costelinha suina': 'Feijão Tropeiro',
  'feijao tropeiro com lombo suino':     'Feijão Tropeiro',
  'tutu de feijao com bisteca':          'Tutu de Feijão à Mineira',
  // ── Suína: omelete ────────────────────────────────────────────────────
  'omelete ao forno ( tomate, cebola e mussarela)': 'Omelete de forno recheada',
  // ── Peixe ─────────────────────────────────────────────────────────────
  'file de peixe ao molho tartaro':      'Filé à belle meunière',
  'isca de peixe com molho de limao':    'Isca de peixe empanada',
  'iscas de peixe com molho de limao':   'Isca de peixe empanada',
  'tiras de peixe ao molho de limao':    'Isca de peixe empanada',
  // ── Lasanha ───────────────────────────────────────────────────────────
  'lasanha de berinjela ( para quem nao come berinjela pode solicitar ovos)': 'Lasanha à Bolonhesa',
  'lasanha de frango':                   'Lasanha à Bolonhesa',
  'lasanha de panela':                   'Lasanha à Bolonhesa',
  'lasanha de panela a bolonhesa':       'Lasanha à Bolonhesa',
  // ── Guarnições: Arroz variantes ───────────────────────────────────────────
  'arroz a grega':                             'Arroz à grega',
  'arroz a grega - milho e salsa':             'Arroz à grega',
  'arroz a grega - milho':                     'Arroz à grega',
  'arroz a grega (cenoura, milho e salsa)':    'Arroz à grega',
  'arroz a grega (milho e salsa)':             'Arroz à grega',
  'arroz a grega( milho e salsa)':             'Arroz à grega',
  'arroz com cenoura':                         'Arroz à grega',
  'arroz com milho':                           'Arroz à grega',
  'arroz com cenoura / farofa':                'Arroz à grega',
  'arroz com cenoura e brocolis':              'Arroz com brócolis',
  'arroz branco e repolho refogado':           'Arroz branco',
  // ── Guarnições: Farofa variantes ─────────────────────────────────────────
  'farofa completa':                           'Farofa de bacon',
  'farofa de cenoura':                         'Farofa de bacon',
  'farofa de temperada':                       'Farofa de bacon',
  'farofa simples':                            'Farofa de bacon',
  'farofa temperada':                          'Farofa de bacon',
  'farofa temperado':                          'Farofa de bacon',
  'farofa temperado / caldinho verde':         'Farofa de bacon',
  'farofa de bacon com cenoura':               'Farofa de bacon',
  // ── Guarnições: Batata variantes ─────────────────────────────────────────
  'batata assada':                             'Batata rústica assada',
  'batata rustica':                            'Batata rústica assada',
  'batata rustica com alecrim':                'Batata rústica assada',
  'batata doce em cubos assada com azeite e alecrim': 'Batata doce assada',
  'batata doce chips':                         'Batata doce assada',
  'chips batata doce':                         'Batata doce assada',
  'chips de batata doce':                      'Batata doce assada',
  'batata em conserva':                        'Batata sauté',
  'batata frita na panela de pressao':         'Batata frita',
  'fritas':                                    'Batata frita',
  'batata e cenoura':                          'Batata e cenoura cozidas',
  // ── Guarnições: Banana variantes ──────────────────────────────────────────
  'banana da terra frita':                     'Banana frita',
  // ── Guarnições: Brócolis / Couve-flor ────────────────────────────────────
  'brocolis':                                  'Brócolis refogado',
  'brocolis com couve- flor':                  'Brócolis refogado',
  'brocolis com couve flor':                   'Brócolis refogado',
  'brocolis com couve-flor':                   'Brócolis refogado',
  'brocolis e couve flor refogado':            'Brócolis refogado',
  'brocolis e cenoura refogado':               'Brócolis refogado',
  // ── Guarnições: Berinjela ─────────────────────────────────────────────────
  'berinjela empanada frita':                  'Berinjela empanada',
  'berinjela empanada frita / farofa temperada': 'Berinjela empanada',
  // ── Guarnições: Mandioca ─────────────────────────────────────────────────
  'mandioca':                                  'Mandioca cozida',
  // ── Guarnições: Purê variantes ────────────────────────────────────────────
  'pure de abobora':                           'Purê de abóbora',
  'pure de moranga':                           'Purê de abóbora',
  'pure de batata':                            'Purê de batata',
  'pure de batata (pronto)':                   'Purê de batata',
  'pure de batata doce':                       'Purê de batata doce',
  'pure de mandioca':                          'Purê de mandioca',
  'creme de batata':                           'Creme de batata',
  // ── Guarnições: Polenta / Angu ───────────────────────────────────────────
  'polenta':                                   'Polenta cremosa',
  'polenta cremosa':                           'Polenta cremosa',
  'polenta frita':                             'Polenta frita',
  // ── Guarnições: Pirão variantes ───────────────────────────────────────────
  'pirao de costela':                          'Pirão',
  // ── Guarnições: Macarrão variantes ───────────────────────────────────────
  'macarrao':                                  'Macarrão alho e óleo',
  'macarrao - molho a aparte tomate':          'Macarrão ao sugo',
  'macarrao alho e oleo':                      'Macarrão alho e óleo',
  'macarrao oleo e alho':                      'Macarrão alho e óleo',
  'macarrao bolonhesa':                        'Macarrão ao sugo',
  // ── Guarnições: Feijão variantes ─────────────────────────────────────────
  'caldinho feijao':                           'Caldinho de feijão',
  'caldinho de feijao':                        'Caldinho de feijão',
  'feijao com abobora':                        'Feijão com abóbora',
  'feijao tropeiro':                           'Feijão Tropeiro',
  // ── Guarnições: Legumes variantes ────────────────────────────────────────
  'abobora refogada':                          'Purê de abóbora',
  'abobrinha refofada':                        'Abobrinha refogada',
  'legumes (cenoura cozida e abobora assada)': 'Legumes cozidos',
  'legumes salteados (batata doce assada e cenoura refogada)': 'Batata doce assada',
  'couve refogada e farofa':                   'Couve refogada',
  'cenoura com beterraba cozida':              'Cenoura com beterraba cozida',
  // ── Guarnições: Repolho ───────────────────────────────────────────────────
  'repolho refogado / farofa temperada':       'Repolho refogado',
  // ── Guarnições: Salada de maionese como guarnicao ─────────────────────────
  'salada de maionese':                        'Maionese de legumes',
  'salada de repolho e cenoura ralada':        'Salada de repolho com cenoura',
  // ── Sobremesas: Frutas naturais ───────────────────────────────────────────
  'abacaxi':                                   'Fruta da estação porcionada',
  'banana':                                    'Banana caramelizada',
  'goiaba':                                    'Fruta da estação porcionada',
  'maca':                                      'Fruta da estação porcionada',
  'melancia':                                  'Fruta da estação porcionada',
  'melao':                                     'Fruta da estação porcionada',
  'mexerica':                                  'Fruta da estação porcionada',
  // ── Sobremesas: Arroz doce / Canjica ─────────────────────────────────────
  'arroz doce':                                'Arroz doce com canela',
  'arroz de leite':                            'Arroz de leite com canela',
  'canjica':                                   'Canjica branca',
  // ── Sobremesas: Cocada / Curau ────────────────────────────────────────────
  'cocada':                                    'Cocada cremosa',
  'curau':                                     'Curau de milho verde',
  // ── Sobremesas: Doce de banana ────────────────────────────────────────────
  'doce de banana':                            'Doce de banana em calda',
  // ── Sobremesas: Gelatina variantes ────────────────────────────────────────
  'gelatina':                                  'Gelatina colorida',
  'gelatina de abacaxi':                       'Gelatina colorida',
  'gelatina de morango':                       'Gelatina colorida',
  'gelatina colorida cremosa':                 'Gelatina com creme',
  'gelatina cremosa':                          'Gelatina com creme',
  // ── Sobremesas: Mousse variantes ──────────────────────────────────────────
  'mousse de chocolate':                       'Mousse de chocolate',
  'mousse de maracuja':                        'Mousse de maracujá',
  // ── Sobremesas: Pudim variantes ───────────────────────────────────────────
  'pudim':                                     'Pudim de leite condensado',
  'pudim de leite':                            'Pudim de leite condensado',
  'pudim de baunilha':                         'Flan de baunilha',
  'pudim de corte (morango)':                  'Pudim de leite condensado',
  'pudim de morango':                          'Pudim de leite condensado',
  'napolitano (pudim morango e chocolate)':    'Pudim de leite condensado',
  // ── Sobremesas: Pavê variantes ────────────────────────────────────────────
  'pave de brigadeiro com baunilha':           'Pavê de bolacha',
  // ── Sobremesas: Creme de frutas ───────────────────────────────────────────
  'creme de framboesa gelado':                 'Creme de framboesa',
  // ── Saladas: Alface variantes ─────────────────────────────────────────────
  'alface':                                    'Salada de Alface com Tomate',
  'alface + tomate':                           'Salada de Alface com Tomate',
  'alface , tomate e pepino':                  'Salada de Alface com Tomate',
  'alface americana com tomate':               'Salada de Alface com Tomate',
  'alface americana e cebola roxa':            'Salada de Alface com Tomate',
  'alface americana e pepino japones':         'Salada de Alface com Tomate',
  'alface americana e tomate':                 'Salada de Alface com Tomate',
  'alface americano ,tomate e pepino':         'Salada de Alface com Tomate',
  'alface americano com manga':                'Salada tropical com manga',
  'alface americano com tomate':               'Salada de Alface com Tomate',
  'alface americano com tomate e cebola roxo a parte': 'Salada de Alface com Tomate',
  'alface americano com tomate e pepino':      'Salada de Alface com Tomate',
  'alface americano e tomate':                 'Salada de Alface com Tomate',
  'alface americano, tomate':                  'Salada de Alface com Tomate',
  'alface americano, tomate e cebola a parte': 'Salada de Alface com Tomate',
  'alface americano, tomate e pepino':         'Salada de Alface com Tomate',
  'alface com cenoura e cebola':               'Salada de Alface com Tomate',
  'alface com manga':                          'Salada tropical com manga',
  'alface com pepino e tomate':                'Salada de Alface com Tomate',
  'alface com tomate':                         'Salada de Alface com Tomate',
  'salada de alface + tomate':                 'Salada de Alface com Tomate',
  'salada de alface, tomate e cebola em rodelas': 'Salada de Alface com Tomate',
  // ── Saladas: Abobrinha variantes ──────────────────────────────────────────
  'abobrinha':                                 'Salada de abobrinha',
  'abobrinha com cenoura':                     'Salada de abobrinha',
  'abobrinha refogada':                        'Salada de abobrinha',
  'abobrinha, tomate e cebola':                'Salada de abobrinha',
  'salada de abobrinha':                       'Salada de abobrinha',
  // ── Saladas: Acelga variantes ─────────────────────────────────────────────
  'acelga com cenoura':                        'Acelga refogada',
  'acelga com manga':                          'Salada tropical com manga',
  'acelga com tomate':                         'Acelga refogada',
  // ── Saladas: Agrião variantes ─────────────────────────────────────────────
  'agriao com tomate':                         'Salada verde com agrião',
  'agriao com tomate e pepino':                'Salada verde com agrião',
  'agriao, cebola e tomate salada':            'Salada verde com agrião',
  // ── Saladas: Beterraba ────────────────────────────────────────────────────
  'salada de beterraba com cenoura':           'Salada de beterraba',
  'salada de cenours ralads/ tomate':          'Cenoura ralada temperada',
  // ── Saladas: Chuchu ───────────────────────────────────────────────────────
  'salada de chuchu':                          'Salada de chuchu',
  // ── Saladas: Pepino ───────────────────────────────────────────────────────
  'tomate com pepino':                         'Salada de pepino',
  'tomate e pepino japones':                   'Salada de pepino',
  // ── Saladas: Repolho variantes ───────────────────────────────────────────
  'repolho com maca sobremesa: arroz doce':    'Salada de repolho com cenoura',
  'repolho com manga':                         'Salada de repolho com manga',
  'repolho e acelga':                          'Salada de repolho com cenoura',
  'repolho e cenoura':                         'Salada de repolho com cenoura',
  'repolho e cenoura ralada':                  'Salada de repolho com cenoura',
  'repolho refogado' :                         'Repolho refogado',
  'repolho roxo com cenoura':                  'Agridoce de repolho roxo',
  'repolho roxo com cenoura ralada':           'Agridoce de repolho roxo',
  'repolho roxo com tomate':                   'Agridoce de repolho roxo',
  'repolho roxo com tomate e cebola':          'Agridoce de repolho roxo',
  'repolho roxo comtomate':                    'Agridoce de repolho roxo',
  'repolho roxo ralado com tomate':            'Agridoce de repolho roxo',
  // ── Saladas: Rúcula ──────────────────────────────────────────────────────
  'rucula com tomate':                         'Salada verde com rúcula',
  'rucula e tomate':                           'Salada verde com rúcula',
  // ── Saladas: Salpicão ────────────────────────────────────────────────────
  'salpicao':                                  'Salpicão',
  // ── Saladas: Salada verde ────────────────────────────────────────────────
  'salada verde ( couve com alface)':          'Mix de folhas com dressing',
  // ── Saladas: Vinagrete variantes ─────────────────────────────────────────
  'vinagrete - tomate, cebola roxa e pimentao verde': 'Vinagrete',
  'vinagrete ( tomate, cebola roxa e pimentao verde)': 'Vinagrete',
  'vinagrete ( tomate, pimentao verde e cebola roxa)': 'Vinagrete',
  'vinagrete( tomate/ cebola e pimentao verde)': 'Vinagrete',
};

/** Receita do prato (por nome), ou null.
 *  Verifica primeiro o índice exato; depois o mapa de aliases históricos. */
export function receitaDoPrato(prato: string | null | undefined): Receita | null {
  const k = normReceita(prato);
  if (!k) return null;
  const direta = RECEITAS[k];
  if (direta) return direta;
  const aliasAlvo = ALIASES_RECEITA[k];
  return aliasAlvo ? (RECEITAS[normReceita(aliasAlvo)] ?? null) : null;
}

/** Itens de compra de uma receita, escalados pelo nº de pessoas. */
export function itensDaReceita(prato: string, pessoas: number): ItemSugerido[] | null {
  const r = receitaDoPrato(prato);
  if (!r) return null;
  return r.ingredientes.map((ing) => ({
    item: ing.item,
    unid: ing.unid,
    qtd: ing.porPessoa * Math.max(pessoas, 0),
    fonte: 'receita' as const,
  }));
}

/** Nomes de pratos com receita, agrupados por categoria (para os seletores). */
export const RECEITAS_POR_CATEGORIA: Record<CategoriaReceita, string[]> = {
  principal: TODAS_RECEITAS.filter((r) => r.categoria === 'principal').map((r) => r.nome),
  guarnicao: TODAS_RECEITAS.filter((r) => r.categoria === 'guarnicao').map((r) => r.nome),
  salada: TODAS_RECEITAS.filter((r) => r.categoria === 'salada').map((r) => r.nome),
  sobremesa: TODAS_RECEITAS.filter((r) => r.categoria === 'sobremesa').map((r) => r.nome),
};

/**
 * Guarnições fixas (base de arroz e feijão) — todas com receita na
 * biblioteca. Usadas no seletor "Guarnição fixa" do cardápio para que
 * NENHUMA opção exista sem receita completa. A primeira é o padrão do dia.
 */
export const GUARNICOES_FIXAS: string[] = [
  'Arroz e Feijão',
  'Arroz branco',
  'Feijão carioca',
  'Feijão preto',
  'Arroz integral',
].filter((nome) => !!RECEITAS[normReceita(nome)]);

/* ------------------------------ custo ao vivo ------------------------------ */

export interface CustoReceita {
  porRefeicao: number; // R$ por porção
  total: number; // R$ para o nº de pessoas informado
  itensComPreco: number;
  itensTotal: number;
  itensSemPreco: string[]; // ingredientes sem cotação válida
  completo: boolean; // todos os ingredientes (não opcionais) têm preço?
}

/**
 * Custo da receita a partir da cotação atual (precos por item normalizado).
 * `estimativas` é uma tabela opcional de preço de reserva (item → R$),
 * usada quando não há cotação real. Nunca inventa preço: itens sem preço
 * entram em `itensSemPreco` e não contam no total.
 */
export function custoReceita(
  prato: string,
  pessoas: number,
  precos: Record<string, number>,
  estimativas?: Record<string, number>,
): CustoReceita | null {
  const r = receitaDoPrato(prato);
  if (!r) return null;
  let total = 0;
  let com = 0;
  const semPreco: string[] = [];
  for (const ing of r.ingredientes) {
    const k = normReceita(ing.item);
    const p = precos[k] ?? estimativas?.[k] ?? 0;
    if (p > 0) {
      total += p * ing.porPessoa * Math.max(pessoas, 0);
      com++;
    } else if (!ing.opcional) {
      semPreco.push(ing.item);
    }
  }
  return {
    porRefeicao: pessoas > 0 ? total / pessoas : 0,
    total,
    itensComPreco: com,
    itensTotal: r.ingredientes.length,
    itensSemPreco: semPreco,
    completo: semPreco.length === 0,
  };
}

/* ------------------------------ estatísticas ------------------------------ */

/** Quantos pratos completos a biblioteca tem (regra: nenhum prato sem receita completa). */
export const RECEITAS_INCOMPLETAS: string[] = TODAS_RECEITAS.filter((r) => !receitaCompleta(r)).map(
  (r) => r.nome,
);

export const TOTAL_RECEITAS = TODAS_RECEITAS.length;
