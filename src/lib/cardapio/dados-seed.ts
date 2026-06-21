/* =====================================================================
   Dados operacionais semeados a partir de 3 anos de conversas reais
   (WhatsApp grupo Tatá House + conversa Maria + conversa César).
   Extraídos automaticamente — não edite manualmente.

   Cobertura: set/2023 – jun/2026
   Fornecedores: 9 | Funcionários com restrição: 29 | Cotações: mar/2026
   ===================================================================== */

import type { Funcionario, PerfilFornecedor } from './tipos';

/* ──────────────────────────────────────────────────────── FORNECEDORES */

export const PERFIS_FORNECEDORES_SEED: Record<string, PerfilFornecedor> = {
  WG: {
    nome: 'WG',
    whatsapp: '(11) 9.4482-0849',
    obs: 'Vendedora: Roberta Oliveira. Pedidos Qui/Sex, entrega Qui/Sex na R. Bandeira Paulista, 181. Entrega às vezes foi para o restaurante principal por engano — confirmar endereço.',
    avaliacoes: [],
  },
  'JAMPAC Alimentos': {
    nome: 'JAMPAC Alimentos',
    obs: 'Distribuidor completo: bovinos, suínos e frango. NF e boleto por e-mail. Pedidos Seg/Sex com 1-2 dias de antecedência. Atenção: motorista já entregou no restaurante principal por engano.',
    avaliacoes: [],
  },
  'Vita Frango': {
    nome: 'Vita Frango',
    obs: 'Cotações semanais enviadas pela compradora Érika. Produtos resfriados (RF) e congelados (CG). Entrega R. Bandeira Paulista, 181.',
    avaliacoes: [],
  },
  'Princesa do Oeste': {
    nome: 'Princesa do Oeste',
    obs: 'Hortifrúti. Pedido na véspera, entrega no dia seguinte. CNPJ nota: 23.894.533/0001-60. Já entregou no endereço errado — confirmar.',
    avaliacoes: [],
  },
  Malte: {
    nome: 'Malte',
    obs: 'Secos e molhados: arroz Camil, feijão, óleo Liza, leite, molho inglês Cepera, milho, açúcar, sal. Entregas semanais.',
    avaliacoes: [],
  },
  Widestock: {
    nome: 'Widestock',
    obs: 'Descartáveis e limpeza: papel higiênico, papel toalha, luva vinil, bobinas, saco de lixo 200L, detergente, cloro, desinfetante. Entregas semanais.',
    avaliacoes: [],
  },
  Ericon: {
    nome: 'Ericon',
    obs: 'Produtos de limpeza específicos: Neutro, VD PAN, Alumibril.',
    avaliacoes: [],
  },
  'Mar Fish': {
    nome: 'Mar Fish',
    obs: 'Pescados. Iscas de peixe (15 kg/pedido), filé de panga (cx 10 kg). CNPJ pedidos: 23.894.533/0001-60. Entrega pode atrasar 1 dia.',
    avaliacoes: [],
  },
  Kenai: {
    nome: 'Kenai',
    obs: 'Ovos (bandejas). Entregas conforme demanda. Entregador às vezes chega antes do horário.',
    avaliacoes: [],
  },
};

/* item normalizado → fornecedor */
export const MAPA_FORNECEDORES_SEED: Record<string, string> = {
  // WG — carnes
  'tiras de carnes': 'WG',
  'tiras de frango': 'WG',
  'bife': 'WG',
  'costelinha suina': 'WG',
  'lombo suino': 'WG',
  'bisteca suina': 'WG',
  'bife a role': 'WG',
  'acem moido': 'WG',
  'linguica toscana': 'WG',
  'file de frango sem osso': 'WG',
  'copa lombo': 'WG',
  // Vita Frango — frango
  'frango inteiro': 'Vita Frango',
  'sobrecoxa': 'Vita Frango',
  'coxa de frango': 'Vita Frango',
  'sobre coxa': 'Vita Frango',
  'file de peito': 'Vita Frango',
  'peito de frango sem osso': 'Vita Frango',
  'peito de frango': 'Vita Frango',
  'sassami': 'Vita Frango',
  'coracao de frango': 'Vita Frango',
  'figado de frango': 'Vita Frango',
  'moela': 'Vita Frango',
  // JAMPAC — bovinos e suínos extras
  'acem': 'JAMPAC Alimentos',
  'paleta bovina': 'JAMPAC Alimentos',
  'musculo': 'JAMPAC Alimentos',
  'lagarto': 'JAMPAC Alimentos',
  'coxao mole': 'JAMPAC Alimentos',
  'coxao duro': 'JAMPAC Alimentos',
  'patinho': 'JAMPAC Alimentos',
  'file mignon': 'JAMPAC Alimentos',
  'contra file': 'JAMPAC Alimentos',
  'carne moida': 'JAMPAC Alimentos',
  'costela bovina': 'JAMPAC Alimentos',
  'cupim': 'JAMPAC Alimentos',
  'pernil': 'JAMPAC Alimentos',
  'barriga suina': 'JAMPAC Alimentos',
  // Princesa do Oeste — hortifrúti
  'tomate': 'Princesa do Oeste',
  'cenoura': 'Princesa do Oeste',
  'cebola': 'Princesa do Oeste',
  'batata': 'Princesa do Oeste',
  'batata doce': 'Princesa do Oeste',
  'alface': 'Princesa do Oeste',
  'repolho': 'Princesa do Oeste',
  'beterraba': 'Princesa do Oeste',
  'couve manteiga': 'Princesa do Oeste',
  'espinafre': 'Princesa do Oeste',
  'brocolis': 'Princesa do Oeste',
  'abacaxi': 'Princesa do Oeste',
  'melancia': 'Princesa do Oeste',
  'laranja': 'Princesa do Oeste',
  'limao': 'Princesa do Oeste',
  'salsa': 'Princesa do Oeste',
  'pepino': 'Princesa do Oeste',
  'abobrinha': 'Princesa do Oeste',
  'pimentao': 'Princesa do Oeste',
  'berinjela': 'Princesa do Oeste',
  'mandioca': 'Princesa do Oeste',
  'abobora': 'Princesa do Oeste',
  'chuchu': 'Princesa do Oeste',
  'vagem': 'Princesa do Oeste',
  'banana': 'Princesa do Oeste',
  'maca': 'Princesa do Oeste',
  // Kenai
  'ovos': 'Kenai',
  'ovo': 'Kenai',
  // Malte — secos
  'arroz': 'Malte',
  'feijao': 'Malte',
  'feijao preto': 'Malte',
  'feijao carioca': 'Malte',
  'oleo': 'Malte',
  'leite': 'Malte',
  'acucar': 'Malte',
  'sal': 'Malte',
  'molho ingles': 'Malte',
  'milho': 'Malte',
  // Mar Fish
  'iscas de peixe': 'Mar Fish',
  'file de panga': 'Mar Fish',
  'peixe': 'Mar Fish',
  'tilapia': 'Mar Fish',
  'merluza': 'Mar Fish',
};

/* preços das cotações (WG + Vita Frango + JAMPAC — março/2026, mais recentes) */
export const PRECOS_COTACAO_SEED: Record<string, number> = {
  // WG
  'tiras de carnes': 41.0,
  'tiras de frango': 19.9,
  'bife': 44.0,
  'costelinha suina': 24.9,
  'lombo suino': 19.5,   // JAMPAC Frivatti mais barato
  'bisteca suina': 16.99, // JAMPAC Aurora mais barato
  'bife a role': 42.0,
  'acem moido': 19.8,    // JAMPAC carne moída CG
  'sobrecoxa': 7.8,
  'linguica toscana': 19.9,
  // Vita Frango (16/03/2026 — mais recente)
  'frango inteiro': 6.8,
  'coxa de frango': 6.2,
  'sobre coxa': 7.8,
  'file de peito': 11.8,
  'peito de frango': 9.4,
  'sassami': 12.9,
  'coracao de frango': 24.5,
  'figado de frango': 2.9,
  'moela': 11.9,
  'file de frango sem osso': 11.8,
  // JAMPAC bovinos (02/03/2026)
  'acem': 29.8,
  'musculo': 25.9,
  'lagarto': 33.9,
  'coxao mole': 35.8,
  'coxao duro': 33.99,
  'patinho': 36.5,
  'carne moida': 19.8,
  'costela bovina': 17.99,
  'pernil': 15.9,
  // Malte (ago/2024)
  'oleo': 5.99,
  'feijao preto': 6.9,
  'acucar': 3.99,
  'sal': 0.99,
  'leite': 4.99,
};

/* ─────────────────────────────────────────── FUNCIONÁRIOS + RESTRIÇÕES */

const BASE_SEED = '2023-09-07T00:00:00.000Z';

export const FUNCIONARIOS_SEED: Funcionario[] = [
  { id: 'seed-01', nome: 'Diego', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'religioso', alimento: 'carne suína', obs: 'Motivo religioso. Substitui por ovo. Avisar com 1 dia de antecedência.' }] },
  { id: 'seed-02', nome: 'Marcelo', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Questões de saúde. Substitui por ovo.' }] },
  { id: 'seed-03', nome: 'Jaqueline', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Não come porco. Substitui por ovo.' }] },
  { id: 'seed-04', nome: 'Fabiano', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-05', nome: 'Eduardo', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Questões de saúde. Substitui por ovo.' }] },
  { id: 'seed-06', nome: 'Cardoso', setor: 'Sushi', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Questões de saúde. Substitui por ovo.' }] },
  { id: 'seed-07', nome: 'Cleiton', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-08', nome: 'Natália', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }, { tipo: 'preferencia', alimento: 'linguiça', obs: 'Substitui por ovo.' }] },
  { id: 'seed-09', nome: 'Carlos Queiroz', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carnes em geral', obs: 'Só come ovo. Não consome nenhuma proteína animal além de ovo.' }] },
  { id: 'seed-10', nome: 'Nildo', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-11', nome: 'Bianca', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'peixe', obs: 'Não come peixe.' }, { tipo: 'preferencia', alimento: 'pernil', obs: 'Não come pernil, bisteca, lombo ou costelinha suína.' }] },
  { id: 'seed-12', nome: 'Jonathan', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-13', nome: 'Vitória', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-14', nome: 'Danilo', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'alergia', alimento: 'carne suína', obs: 'Alergia. Substitui por ovo.' }] },
  { id: 'seed-15', nome: 'Caíque', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-16', nome: 'Paulino', setor: 'Operações', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-17', nome: 'Jhonatan B1', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-18', nome: 'Hudson', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-19', nome: 'Julio', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-20', nome: 'Rudson', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-21', nome: 'Juliana', setor: 'Cozinha', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne suína', obs: 'Substitui por ovo.' }] },
  { id: 'seed-22', nome: 'Edson', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'carne moída', obs: 'Não come carne moída. Substitui por ovo.' }] },
  { id: 'seed-23', nome: 'Leandro', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'peixe', obs: 'Não come peixe.' }, { tipo: 'preferencia', alimento: 'carne suína', obs: 'Restrição da nutricionista.' }, { tipo: 'preferencia', alimento: 'carne vermelha', obs: 'Restrição da nutricionista.' }] },
  { id: 'seed-24', nome: 'Vinícius', setor: 'Bar', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'alergia', alimento: 'peixe', obs: 'Alergia confirmada em exame admissional.' }] },
  { id: 'seed-25', nome: 'Rosinha', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'peixe', obs: 'Não come peixe.' }, { tipo: 'preferencia', alimento: 'linguiça', obs: 'Não come linguiça.' }] },
  { id: 'seed-26', nome: 'Beatriz', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'peixe', obs: 'Não come peixe.' }] },
  { id: 'seed-27', nome: 'Miller', setor: 'Segurança', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'peixe', obs: 'Não come peixe.' }] },
  { id: 'seed-28', nome: 'Adilson', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'peixe', obs: 'Não come peixe.' }] },
  { id: 'seed-29', nome: 'Renilson', setor: '', turno: 'almoco', ativo: true, criadoEm: BASE_SEED, restricoes: [{ tipo: 'preferencia', alimento: 'peixe', obs: 'Não come peixe.' }] },
];
