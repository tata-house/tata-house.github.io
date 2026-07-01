/* =====================================================================
   Dados operacionais semeados a partir de 3 anos de conversas reais
   (WhatsApp grupo Tatá House + conversa Maria + conversa César),
   varredura de 624 fotos de NF/entrega (ago/2023 – jun/2026) e
   planilha "Alimentação de Funcionário jan-mai 2026" (263 produtos,
   1 229 linhas de compra, 23 fornecedores).

   Cobertura: set/2023 – jun/2026
   Fornecedores: 17 | Funcionários com restrição: 29 | Cotações: mai/2026
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
  'Frango da Nonna': {
    nome: 'Frango da Nonna',
    obs: 'Frango da Nonna Comercial Avícola Ltda. Melhor preço de coxa e sobre coxa (R$6,00/kg) e frango inteiro (R$6,90/kg) conforme planilha jan–mai/2026. Concorre com Vita Frango para aves resfriadas.',
    avaliacoes: [],
  },
  'Jonaldo': {
    nome: 'Jonaldo',
    obs: '52940425 Jonaldo Francisco de Santana. Temperos a granel: alho descascado, chimichurri, colorau, caldo de carne/galinha, ervas finas, salsa desidratada, tempero baiano. Preço padrão R$25,00/kg. Fonte: planilha jan–mai/2026.',
    avaliacoes: [],
  },
  'Irmãos Avelino': {
    nome: 'Irmãos Avelino',
    obs: 'DISTRIB. E IMP. IRMAOS AVELINO S.A. Distribuidor diversificado: carnes, laticínios, secos e molhados. 42 produtos na planilha jan–mai/2026. Atenção: preços por vezes acima de supermercados — comparar antes de fechar pedido.',
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
  // Frango da Nonna — melhor preço para aves inteiras e coxa (planilha jan-mai/2026)
  'frango inteiro': 'Frango da Nonna',
  'coxa e sobre coxa': 'Frango da Nonna',
  'frango a passarinho': 'WG',
  // Vita Frango — frango desossado e cortes especiais
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
  'file de frango': 'Vita Frango',
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
  // Hortifrúti — FLD é o fornecedor principal confirmado (planilha jan-mai/2026, 61 itens)
  'tomate': 'FLD',
  'cenoura': 'FLD',
  'cebola': 'FLD',
  'cebola branca': 'FLD',
  'cebola roxa': 'FLD',
  'batata': 'FLD',
  'batata doce': 'FLD',
  'chuchu': 'FLD',
  'couve manteiga': 'FLD',
  'couve flor': 'FLD',
  'pepino': 'FLD',
  'abacaxi': 'FLD',
  'abobrinha italiana': 'FLD',
  'abobrinha': 'FLD',
  'abobora': 'FLD',
  'abobora japonesa': 'FLD',
  'acelga': 'FLD',
  'alface': 'FLD',
  'alface americana': 'FLD',
  'alface americano': 'FLD',
  'alface crespa': 'FLD',
  'alface lisa': 'FLD',
  'agriao': 'FLD',
  'rucula': 'FLD',
  'coentro': 'FLD',
  'cheiro verde': 'FLD',
  'salsinha': 'FLD',
  'abacate': 'FLD',
  'milho verde': 'FLD',
  'beterraba': 'FLD',
  'brocolis': 'FLD',
  'goiaba': 'FLD',
  'laranja': 'FLD',
  'limao': 'FLD',
  'mandioca': 'FLD',
  'melancia': 'FLD',
  'melao': 'FLD',
  'pimentao': 'FLD',
  'pimentao verde': 'FLD',
  'pimentao amarelo': 'FLD',
  'pimentao vermelho': 'FLD',
  'repolho': 'FLD',
  'repolho branco': 'FLD',
  'repolho roxo': 'FLD',
  'banana': 'FLD',
  'espinafre': 'Princesa do Oeste',
  'berinjela': 'Princesa do Oeste',
  'vagem': 'Princesa do Oeste',
  'maca': 'Princesa do Oeste',
  'salsa': 'Princesa do Oeste',
  // Kenai — ovos
  'ovos': 'Kenai',
  'ovo': 'Kenai',
  // Jonaldo — temperos a granel (planilha jan-mai/2026)
  'alho descascado': 'Jonaldo',
  'caldo de carne': 'Jonaldo',
  'caldo de galinha': 'Jonaldo',
  'chimichurri': 'Jonaldo',
  'colorau': 'Jonaldo',
  'ervas finas': 'Jonaldo',
  'salsa desidratada': 'Jonaldo',
  'tempero baiano': 'Jonaldo',
  // Malte — secos
  'arroz': 'Malte',
  'feijao': 'Malte',
  'feijao preto': 'Malte',
  'feijao carioca': 'Malte',
  'feijao fradinho': 'Malte',
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

/* preços mais recentes por item — melhor preço identificado entre fornecedores
   Fonte primária: planilha "Alimentação Funcionário jan–mai/2026" (263 produtos)
   Complemento: NFs + cotações mar-abr/2026 para itens ausentes na planilha */
export const PRECOS_COTACAO_SEED: Record<string, number> = {
  // ── Carnes bovinas ───────────────────────────────────────────────────────
  // Frigosul (planilha jan-mai/2026)
  'acem em cubo': 30.90,
  'aranha alcatra': 31.50,
  // JAMPAC (planilha jan-mai/2026 e cotação mar/2026)
  'acem': 29.8,
  'alcatra': 30.5,
  'coxao mole': 35.8,
  'coxao duro': 33.99,
  'lagarto': 33.9,
  'musculo': 25.9,
  'patinho': 36.5,
  'costela bovina': 17.99,
  'cupim': 32.0,
  // Apetito Foods (planilha jan-mai/2026)
  'carne moida': 18.49,
  'carne seca': 36.58,
  // ── Carnes suínas ────────────────────────────────────────────────────────
  // Apetito Foods (planilha jan-mai/2026)
  'bisteca suina': 14.88,
  'lombo suino': 18.49,
  // WG (planilha jan-mai/2026)
  'costelinha suina': 22.0,
  'costela': 10.98,
  'pernil suino': 15.98,
  // WG (cotação mar/2026 — sem alteração na planilha)
  'tiras de carnes': 41.0,
  'bife': 44.0,
  'bife a role': 42.0,
  'copa lombo': 24.0,
  // Apetito Foods (planilha jan-mai/2026)
  'linguica toscana': 13.89,
  // Irmãos Avelino (planilha jan-mai/2026)
  'linguica calabresa': 50.14,
  // ── Aves ─────────────────────────────────────────────────────────────────
  // Frango da Nonna (planilha jan-mai/2026 — melhor preço)
  'frango inteiro': 6.9,
  'coxa e sobre coxa': 6.0,
  // WG (planilha jan-mai/2026)
  'frango a passarinho': 9.98,
  'tiras de frango': 19.9,
  // Vita Frango (cotação mar/2026)
  'coxa de frango': 6.2,
  'sobre coxa': 7.8,
  'sobrecoxa': 7.8,
  'file de peito': 11.8,
  'peito de frango': 9.4,
  'sassami': 12.9,
  'coracao de frango': 24.5,
  'figado de frango': 2.9,
  'moela': 11.9,
  // Apetito Foods / Korisko (planilha jan-mai/2026)
  'file de frango': 11.99,
  'file de frango sem osso': 11.99,
  'acem moido': 32.0,
  // ── Hortifrúti — FLD (planilha jan-mai/2026) ─────────────────────────────
  'abacaxi': 7.4,
  'abobora japonesa': 4.93,
  'abobrinha italiana': 7.4,
  'acelga': 7.6,
  'alface americana': 16.88,
  'alface crespa': 15.3,
  'alface lisa': 16.88,
  'banana': 6.95,
  'banana da terra': 9.69,
  'batata': 11.84,
  'batata doce': 7.4,
  'beterraba': 6.99,
  'brocolis': 20.0,
  'cebola': 4.67,
  'cebola branca': 4.2,
  'cebola roxa': 10.61,
  'cenoura': 4.47,
  'chuchu': 6.58,
  'couve flor': 26.25,
  'couve manteiga': 15.0,
  'goiaba': 14.5,
  'laranja': 4.32,
  'limao': 5.22,
  'mandioca': 7.0,
  'melancia': 4.9,
  'melao': 7.97,
  'pepino': 11.1,
  'pimentao amarelo': 26.5,
  'pimentao verde': 12.5,
  'pimentao vermelho': 26.5,
  'repolho branco': 5.0,
  'repolho roxo': 7.6,
  'tomate': 19.15,
  // Massaru Hortifruti (planilha jan-mai/2026 — melhor preço de cebola)
  // ── Grãos / Massas ───────────────────────────────────────────────────────
  // Roldão / Sendas (planilha jan-mai/2026 — melhor preço)
  'arroz': 15.9,
  'feijao': 5.24,
  'feijao preto': 5.19,
  'feijao fradinho': 7.65,
  'farinha de trigo': 4.69,
  'farinha de rosca': 15.31,
  // Irmãos Avelino (planilha jan-mai/2026)
  'farinha para empanar': 18.72,
  // BIG/WMS (planilha jan-mai/2026)
  'macarrao espaguete': 2.61,
  'macarrao parafuso': 3.3,
  // ── Laticínios ───────────────────────────────────────────────────────────
  // Roldão (planilha jan-mai/2026)
  'creme de leite': 9.59,
  'leite condensado': 37.49,
  'leite': 4.99,
  // Irmãos Avelino / BIG/WMS
  'leite de coco': 3.99,
  // ── Temperos ─────────────────────────────────────────────────────────────
  // FLD (planilha jan-mai/2026)
  'alho descascado': 26.82,
  'coentro': 39.0,
  // Jonaldo (planilha jan-mai/2026)
  'caldo de carne': 25.0,
  'caldo de galinha': 25.0,
  'chimichurri': 25.0,
  'colorau': 25.0,
  'ervas finas': 25.0,
  'salsa desidratada': 25.0,
  'tempero baiano': 25.0,
  // Irmãos Avelino (planilha jan-mai/2026)
  'molho de pimenta': 12.51,
  // WMS (planilha jan-mai/2026)
  'vinagre': 1.35,
  // Atacadão (planilha jan-mai/2026)
  'sal': 2.17,
  // Malte / Roldão (referência)
  'oleo': 5.99,
  'acucar': 3.99,
  // Itens de despensa/hortifrúti sem cotação própria — referência de mercado
  // (substituídos pela cotação real quando o usuário cola).
  'grao de bico': 12.90,
  'ervilha': 9.50,
  'canjica de milho': 7.20,
  'amido de milho': 9.80,
  'uva passa': 24.90,
  'chocolate em po': 22.50,
  'polpa de morango': 18.00,
  'canela em po': 44.00,
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
