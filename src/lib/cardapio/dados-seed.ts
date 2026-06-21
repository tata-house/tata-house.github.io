/* =====================================================================
   Dados operacionais semeados a partir de 3 anos de conversas reais
   (WhatsApp grupo Tatá House + conversa Maria + conversa César)
   e varredura de 624 fotos de NF/entrega (ago/2023 – jun/2026).

   Cobertura: set/2023 – jun/2026
   Fornecedores: 14 | Funcionários com restrição: 29 | Cotações: abr/2026
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
    obs: 'Distribuidor completo: bovinos, suínos e frango (filé de peito congelado cód 33746). NF e boleto por e-mail. Pedidos Seg/Sex com 1-2 dias de antecedência. Atenção: motorista já entregou no restaurante principal por engano.',
    avaliacoes: [],
  },
  'Apetito Foods': {
    nome: 'Apetito Foods',
    obs: 'Carnes bovinas. CNPJ 00.474.763/0001-74. Rua Capitão Almeida de Lardi 86-330. Marcas: Frigospol (patinho GX3) e Jussara A. Motorista: Alexandre Tadeu Solla Espinosa, placa CXA9778. NFs confirmadas: mar/2026 R$1.076,76 (patinho), abr/2026 R$978,26 (cortes Jussara A).',
    avaliacoes: [],
  },
  'Vita Frango': {
    nome: 'Vita Frango',
    obs: 'Cotações semanais enviadas pela compradora Érika. Produtos resfriados (RF) e congelados (CG). Entrega R. Bandeira Paulista, 181.',
    avaliacoes: [],
  },
  'Princesa do Oeste': {
    nome: 'Princesa do Oeste',
    obs: 'Hortifrúti. Pedido na véspera, entrega no dia seguinte. CNPJ nota: 23.894.533/0001-60. Produtos confirmados: tomate, pepino, alface, melão, cenoura, abacaxi, cebola, repolho roxo, ovos. Endereço entrega: R. Tabapuã 698, Itaim Bibi. Já entregou no endereço errado — confirmar.',
    avaliacoes: [],
  },
  FLD: {
    nome: 'FLD',
    obs: 'Distribuidora de Hortifrutigranjeiro FLD LTDA. CNPJ 37.643.752/0001-80. Rua Silva Airosa 21, Vila Leopoldina, SP CEP 05357-040. NF 403770 de 13/04/2026 (R$397). Concorre com Princesa do Oeste — verificar preço antes de pedido.',
    avaliacoes: [],
  },
  Malte: {
    nome: 'Malte',
    obs: 'Secos e molhados: arroz Solito Tipo 1, feijão Namorado, feijão Camil, óleo Liza, leite, milho, açúcar, sal. Entregas semanais.',
    avaliacoes: [],
  },
  Biofood: {
    nome: 'Biofood',
    obs: 'Secos e condimentos. Produtos confirmados por NF: Açúcar União, Gelatina Qualmax (vários sabores), Molho Inglês Cepera Extra 150ml, Manteiga Blend Econata, Refresco em pó Qualimax (guaraná, tangerina, maracujá), Suco de tomate Radola 1L. NF emitida para TATA SUSHI BANDEIRA (R. Tabapuã 698).',
    avaliacoes: [],
  },
  Widestock: {
    nome: 'Widestock',
    obs: 'Descartáveis e limpeza. CNPJ confirmado em NF. Vendedora: Flávia Luciana Rodrigues Silva. Fone: (11) 3406-6662. Forma de pagamento: ITAÚ WIDE. Entrega Seg-Sáb 8/12 e 13/16. Produtos: papel higiênico, papel toalha, luva vinil, bobinas, saco de lixo 200L, álcool 70%, detergente, desinfetante. NF out/2024 R$409,63.',
    avaliacoes: [],
  },
  Fonplast: {
    nome: 'Fonplast',
    obs: 'Copos descartáveis. Aparece em toda entrega semanal. Produtos: copos descartáveis e pratos isopor. Entrega junto com pedido Widestock ou separado.',
    avaliacoes: [],
  },
  Ericon: {
    nome: 'Ericon',
    obs: 'Produtos de limpeza específicos: Neutro, VD PAN, Alumibril.',
    avaliacoes: [],
  },
  'Mar Fish': {
    nome: 'Mar Fish',
    obs: 'Pescados. Iscas de peixe (15 kg/pedido), filé de panga (cx 10 kg marca TPSCO, Vietnã — importado por Lider Comercio de Pescados EIRELI, CNPJ 18.952.282/0001-71, Av. Autonomista 896 sala 170, Osasco, tel (11)3624-7678). Entrega pode atrasar 1 dia.',
    avaliacoes: [],
  },
  Kenai: {
    nome: 'Kenai',
    obs: 'Ovos (bandejas 30 unidades — CARTELA 30 OVOS EXTRA BRANCO) e hortifrúti diverso. Entregas conforme demanda. Entregador às vezes chega antes do horário.',
    avaliacoes: [],
  },
  'Lider Pescados': {
    nome: 'Lider Pescados',
    obs: 'Lider Comercio de Pescados EIRELI. CNPJ 18.952.282/0001-71. Av. Autonomista 896, Sala 170, Torre Mykonos, Vila Yara, Osasco-SP. Tel: (11) 3624-7678. Importador do filé de panga TPSCO (Pangasius hypophthalmus, Vietnã). Pode ser contato direto alternativo ao Mar Fish.',
    avaliacoes: [],
  },
};

/* item normalizado → fornecedor */
export const MAPA_FORNECEDORES_SEED: Record<string, string> = {
  // WG — carnes frescas e embutidos
  'tiras de carnes': 'WG',
  'tiras de frango': 'WG',
  'bife': 'WG',
  'costelinha suina': 'WG',
  'lombo suino': 'WG',
  'bisteca suina': 'WG',
  'bife a role': 'WG',
  'acem moido': 'WG',
  'linguica toscana': 'WG',
  'linguica calabresa': 'WG',
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
  'file de frango sem osso': 'Vita Frango',
  // JAMPAC — bovinos, suínos extras e frango congelado
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
  // Hortifrúti — FLD (NF confirmada abr/2026) e Princesa do Oeste (pedido mai/2026)
  'tomate': 'FLD',
  'cenoura': 'FLD',
  'cebola': 'FLD',
  'batata': 'FLD',
  'chuchu': 'FLD',
  'couve manteiga': 'FLD',
  'pepino': 'FLD',
  'abacaxi': 'FLD',
  'banana': 'Princesa do Oeste',
  'batata doce': 'Princesa do Oeste',
  'alface': 'Princesa do Oeste',
  'repolho': 'Princesa do Oeste',
  'beterraba': 'Princesa do Oeste',
  'espinafre': 'Princesa do Oeste',
  'brocolis': 'Princesa do Oeste',
  'melancia': 'Princesa do Oeste',
  'melao': 'Princesa do Oeste',
  'laranja': 'Princesa do Oeste',
  'limao': 'Princesa do Oeste',
  'salsa': 'Princesa do Oeste',
  'abobrinha': 'Princesa do Oeste',
  'pimentao': 'Princesa do Oeste',
  'berinjela': 'Princesa do Oeste',
  'mandioca': 'Princesa do Oeste',
  'abobora': 'Princesa do Oeste',
  'vagem': 'Princesa do Oeste',
  'maca': 'Princesa do Oeste',
  // Kenai — ovos
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
  'milho': 'Malte',
  // Biofood — condimentos e secos especiais
  'molho ingles': 'Biofood',
  'gelatina': 'Biofood',
  'manteiga': 'Biofood',
  'refresco': 'Biofood',
  'suco': 'Biofood',
  // Mar Fish — pescados
  'iscas de peixe': 'Mar Fish',
  'file de panga': 'Mar Fish',
  'peixe': 'Mar Fish',
  'tilapia': 'Mar Fish',
  'merluza': 'Mar Fish',
};

/* preços mais recentes por item (fonte: NFs + cotações + tabela comparativa)
   FLD hortifrúti: NF 13/04/2026
   WG + Vita Frango + JAMPAC: cotações mar/2026
   Malte: ago/2024 (desatualizado — atualizar ao renovar pedido) */
export const PRECOS_COTACAO_SEED: Record<string, number> = {
  // WG (cotação mar/2026)
  'tiras de carnes': 41.0,
  'tiras de frango': 19.9,
  'bife': 44.0,
  'costelinha suina': 24.9,
  'lombo suino': 19.5,
  'bisteca suina': 16.99,
  'bife a role': 42.0,
  'acem moido': 19.8,
  'linguica toscana': 19.9,
  // Vita Frango (16/03/2026)
  'frango inteiro': 6.8,
  'coxa de frango': 6.2,
  'sobre coxa': 7.8,
  'sobrecoxa': 7.8,
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
  // FLD hortifrúti (NF 13/04/2026 — preço por kg)
  'abacaxi': 7.4,
  'banana': 9.69,
  'batata': 7.1,
  'cebola': 4.67,
  'cenoura': 8.14,
  'chuchu': 4.93,
  'couve manteiga': 15.0,
  'pepino': 12.33,
  'tomate': 14.8,
  // Princesa do Oeste / tabela mai/2024 (referência — verificar atual)
  'batata doce': 14.5,
  'beterraba': 5.76,
  'repolho': 4.95,
  'alface': 12.95,
  'laranja': 6.53,
  'limao': 4.35,
  'melancia': 3.95,
  // Malte (ago/2024 — desatualizado)
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
