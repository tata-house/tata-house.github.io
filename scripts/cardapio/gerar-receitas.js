const path = require('path');
const dados = require('../../src/lib/cardapio/dados.json');
const fs = require('fs');

function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,'').trim(); }

const BASELINE = 65;

const IS_PROT = {
  frango: /frango|galinha|coxa|sobrecoxa|peito de frango|peito.*frango|file.*frango|file de peito|filezinho|sassami|tiras de frango/i,
  bovina: /bife|acem|acém|alcatra|picanha|costela|patinho|contrafile|bisteca|maminha|carne moid|carne moída|tiras de carne|aranha|chuleta|almôndega|almondegas|almondega|carne em cubos/i,
  suina: /suino|suína|suíno|porco|lombo suíno|lombo suino|linguica|linguiça|costelinha|costelina|pernil|calabresa toscana|toscana/i,
  peixe: /peixe|tilapia|tilápia|salmao|atum|merluza|bacalhau|pescada|camarao|panga|ca[cç][aã]o/i,
};
const PROT_CANONICAL = {
  frango: { item: 'Tiras de frango', unid: 'kg' },
  bovina: { item: 'Acém', unid: 'kg' },
  suina: { item: 'Lombo suíno', unid: 'kg' },
  peixe: { item: 'File de Panga', unid: 'kg' },
};
function protDoItem(nome) {
  for (const [tipo, rx] of Object.entries(IS_PROT)) if (rx.test(nome)) return tipo;
  return null;
}
function protDoPrato(nome) {
  const n = norm(nome);
  if (/frango|coxa.*assada|sobrecoxa|sobre coxa|sse de frango|fricasse|strogonoff de frango|parmegiana de frango|file.*parmegiana|xadrez/.test(n)) return 'frango';
  if (/suin|costelinha com|bisteca (com|de)|lombo|pernil|calabresa|toscana|feijoada|linguica/.test(n)) return 'suina';
  if (/peixe|tilapia|moqueca|panga|pescad|sardinha/.test(n)) return 'peixe';
  if (/carne|bife|acem|costela (bovina|assada|ao molho)|carreteira|almondega|lasanha|strogonoff de carne|escondidinho de carne|picadinho|chuleta|aranha|rabada|churrasco/.test(n)) return 'bovina';
  return null;
}
function categoriaDoPrato(nome) {
  const n = norm(nome);
  // Explicit principals that could be misclassified
  if (/tropeiro|feijoada|baiao de dois|galinhada|sopa|yakisoba|panqueca|arroz de forno|macarrao al pesto|macarrao ao molho|macarrao com|espaguete|lasanha/.test(n)) return 'principal';
  // Sobremesas
  if (/mousse|gelatina|pudim|torta doce|creme de (abacate|abacaxi|framb)|cocada|curau|canjica|flan|pave|pave|\bbolo\b|supresa|prestig|melancia|arroz doce|sorvete|creme de leite.*doce/.test(n)) return 'sobremesa';
  // Saladas
  if (/^(alface|agriao|repolho roxo|beterraba.*cenoura|cenoura.*beterraba|mix de folh|vinagrete|salada de|pepino.*tomate|acelga com)/.test(n)) return 'salada';
  // Guarnicoes (only standalone items, not compound dishes)
  if (/^(arroz (branco|integral|temperado|com|a|e)|feijao (carioca|preto|fradinho|tropeiro nunca)|pure|purê|farofa|mandioca|batata (frit|assad|rustic|palha|em cons)|macarrao alho|brocolis (com|e|refog)|couve (refog|com)|repolho (refog|com)|chuchu|berinjela|abobrinha|pepino salada|espin|banana da terra)/.test(n)) return 'guarnicao';
  return 'principal';
}

const pratosMap = new Map();
dados.combos.forEach(c => {
  const principal = c.chave.split('|')[0].trim();
  const k = norm(principal);
  if (!pratosMap.has(k)) pratosMap.set(k, { nome: principal, combos: [] });
  pratosMap.get(k).combos.push(c.itens);
});

const receitas = [];
pratosMap.forEach((info, k) => {
  const { nome, combos } = info;
  const cat = categoriaDoPrato(nome);
  const prot = protDoPrato(nome);
  const nCombos = combos.length;
  const threshold = Math.max(1, Math.ceil(nCombos * 0.4));

  const itemMap = new Map();
  combos.forEach(combo => {
    const protQtds = {};
    const nonProt = [];
    combo.forEach(it => {
      const p = protDoItem(it.i);
      if (p) { if (!protQtds[p]) protQtds[p] = []; protQtds[p].push(parseFloat(it.q)||0); }
      else nonProt.push(it);
    });
    if (prot && protQtds[prot]) {
      const qtd = Math.max(...protQtds[prot]);
      const pk = 'prot_' + prot;
      if (!itemMap.has(pk)) { const c = PROT_CANONICAL[prot]; itemMap.set(pk, { nome: c.item, unid: c.unid, qtds: [], isProt: true }); }
      itemMap.get(pk).qtds.push(qtd);
    }
    nonProt.forEach(it => {
      const ik = norm(it.i);
      if (!itemMap.has(ik)) itemMap.set(ik, { nome: it.i, unid: it.u||'un', qtds: [], isProt: false });
      if (it.q > 0) itemMap.get(ik).qtds.push(parseFloat(it.q)||0);
    });
  });

  const ingredientes = [];
  itemMap.forEach((item) => {
    if (!item.isProt && item.qtds.length < threshold) return;
    if (item.qtds.length === 0) return;
    const sorted = [...item.qtds].sort((a,b)=>a-b);
    const mediana = sorted[Math.floor(sorted.length/2)];
    if (mediana <= 0) return;
    const porPessoa = Math.round((mediana / BASELINE) * 1000) / 1000;
    if (porPessoa <= 0) return;
    const opcional = item.qtds.length < Math.ceil(nCombos * 0.6) && nCombos > 2 && !item.isProt;
    ingredientes.push({ item: item.nome, unid: item.unid, porPessoa, ...(opcional ? { opcional: true } : {}) });
  });
  ingredientes.sort((a,b) => (protDoItem(a.item)?0:1) - (protDoItem(b.item)?0:1));
  if (ingredientes.length === 0) return;
  receitas.push({ nome, categoria: cat, proteina: prot||undefined, rendimento: BASELINE, numCombos: nCombos, ingredientes });
});

const ord = { principal: 0, guarnicao: 1, salada: 2, sobremesa: 3 };
receitas.sort((a,b) => (ord[a.categoria]||0)-(ord[b.categoria]||0) || a.nome.localeCompare(b.nome,'pt-BR'));

// Generate TypeScript
function q(s) { return JSON.stringify(s); }
let ts = `/* =====================================================================
   Receitas operacionais — geradas automaticamente a partir do histórico
   de ${dados.combos.length} registros de pedidos (dados.json).
   Quantidades derivadas da mediana real de compras para ${BASELINE} pessoas.
   NÃO edite manualmente — regenere com: node scripts/gerar-receitas.js
   ===================================================================== */

import type { Receita } from './receitas';

export const RECEITAS_OPERACIONAIS: Receita[] = [\n`;

receitas.forEach(r => {
  ts += `  {\n`;
  ts += `    nome: ${q(r.nome)},\n`;
  ts += `    categoria: ${q(r.categoria)},\n`;
  if (r.proteina) ts += `    proteina: ${q(r.proteina)},\n`;
  ts += `    rendimento: ${r.rendimento},\n`;
  ts += `    ingredientes: [\n`;
  r.ingredientes.forEach(ing => {
    const parts = [`item: ${q(ing.item)}`, `unid: ${q(ing.unid)}`, `porPessoa: ${ing.porPessoa}`];
    if (ing.opcional) parts.push('opcional: true');
    ts += `      { ${parts.join(', ')} },\n`;
  });
  ts += `    ],\n`;
  ts += `  },\n`;
});

ts += `];\n`;

fs.writeFileSync(path.join(__dirname, '../../src/lib/cardapio/receitas-operacionais.ts'), ts);

const por_cat = {};
receitas.forEach(r => por_cat[r.categoria] = (por_cat[r.categoria]||0)+1);
console.log(`Receitas geradas: ${receitas.length}`);
Object.entries(por_cat).forEach(([k,v]) => console.log(` ${k}: ${v}`));

// Check specific dishes
['Strogonoff de Frango', 'Lasanha de Panela', 'Feijoada com Bisteca', 'File de Frango Grelhado'].forEach(nome => {
  const r = receitas.find(r => norm(r.nome) === norm(nome));
  if (r) console.log(`\n${nome}: [${r.categoria}] proteina=${r.proteina||'none'} | ${r.ingredientes.slice(0,3).map(i=>i.item+' '+i.porPessoa+i.unid).join(', ')}`);
});
