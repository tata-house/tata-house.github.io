/* =====================================================================
   Modo de preparo dos pratos — passo a passo simples para a cozinha
   consultar quando tiver dúvida de como fazer. Quantidades de tempero
   ficam "a gosto"; as proporções de compra estão na receita (receitas.ts).

   Mantido em arquivo próprio (não toca receitas.ts) e indexado por nome
   normalizado, igual ao restante do app. Edite/expanda à vontade.
   ===================================================================== */

function norm(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const LISTA: Record<string, string[]> = {
  /* ----------------------------- Principais ---------------------------- */
  'Frango grelhado': [
    'Tempere o filé de frango com alho, sal e um fio de óleo. Deixe pegar gosto.',
    'Aqueça a chapa ou frigideira grande em fogo alto.',
    'Grelhe os filés dos dois lados até dourar e ficar suculento (não resseque).',
    'Finalize com cebola em rodelas grelhada por cima, se quiser.',
  ],
  'Frango ao molho': [
    'Doure o frango temperado (alho e sal) na panela com um pouco de óleo.',
    'Acrescente cebola picada e refogue até murchar.',
    'Adicione o molho de tomate e um pouco de água; tampe.',
    'Cozinhe em fogo baixo até o frango ficar macio e o molho encorpar.',
  ],
  'Frango xadrez': [
    'Corte o peito de frango em cubos e tempere.',
    'Sele os cubos na panela quente até dourar; reserve.',
    'Refogue cebola, pimentão e cenoura em cubos (deixe crocantes).',
    'Volte o frango, acerte o sal e um toque de shoyu; misture e sirva.',
  ],
  'Frango ensopado': [
    'Doure o frango temperado com alho e sal.',
    'Junte cebola e refogue; acrescente molho de tomate.',
    'Adicione batata e cenoura em cubos e água até cobrir.',
    'Cozinhe até os legumes ficarem macios e o caldo encorpar.',
  ],
  'Carne moída': [
    'Refogue alho e cebola no óleo até dourar.',
    'Acrescente a carne moída e mexa até soltar e perder a água.',
    'Adicione molho de tomate e tempere; deixe apurar.',
    'Opcional: junte cenoura/ervilha em cubos para render mais.',
  ],
  'Carne de panela': [
    'Tempere o acém em cubos com alho e sal.',
    'Sele bem a carne na panela de pressão até dourar.',
    'Junte cebola, cubra com água quente e tampe a pressão.',
    'Cozinhe ~40 min após pegar pressão; acrescente batata no fim, se usar.',
  ],
  'Bife acebolado': [
    'Tempere os bifes de acém com sal e alho.',
    'Grelhe rápido na chapa bem quente dos dois lados.',
    'Refogue bastante cebola em rodelas até ficar dourada.',
    'Cubra os bifes com a cebola e sirva quente.',
  ],
  'Almôndegas': [
    'Misture a carne moída com ovo, cebola picada, sal e tempero.',
    'Modele bolinhas do mesmo tamanho.',
    'Doure as almôndegas na panela; reserve.',
    'Cozinhe-as no molho de tomate por alguns minutos até apurar.',
  ],
  'Filé de peixe': [
    'Tempere os filés com limão, alho e sal; deixe descansar.',
    'Passe levemente em farinha de trigo, se quiser mais firmeza.',
    'Frite ou grelhe em óleo quente até dourar dos dois lados.',
    'Escorra e sirva com gomos de limão.',
  ],
  'Peixe assado': [
    'Tempere os filés com limão, alho e sal.',
    'Forre a assadeira com rodelas de cebola e tomate.',
    'Disponha o peixe por cima e regue com um fio de óleo.',
    'Asse em forno médio até o peixe soltar lascas com o garfo.',
  ],
  'Omelete': [
    'Bata os ovos com sal.',
    'Refogue cebola e tomate picados na frigideira.',
    'Despeje os ovos e cozinhe em fogo baixo.',
    'Dobre ao meio quando firmar e sirva.',
  ],
  'Ovos mexidos': [
    'Bata os ovos com sal.',
    'Refogue a cebola no óleo (opcional).',
    'Acrescente os ovos e mexa em fogo baixo até cremoso.',
    'Tire do fogo ainda úmido — o calor termina de cozinhar.',
  ],
  'Linguiça acebolada': [
    'Corte a linguiça toscana em rodelas grossas.',
    'Doure bem na panela, mexendo de vez em quando.',
    'Acrescente bastante cebola em rodelas.',
    'Refogue até a cebola dourar e a linguiça ficar no ponto.',
  ],
  'Escondidinho de carne': [
    'Cozinhe a mandioca e amasse com um pouco de leite até virar purê.',
    'Prepare a carne moída refogada e bem temperada.',
    'Monte: camada de purê, carne, purê por cima.',
    'Cubra com creme de leite e mussarela e leve ao forno para gratinar.',
  ],
  'Estrogonofe de frango': [
    'Sele o frango em cubos temperados até dourar.',
    'Junte cebola e refogue; acrescente molho de tomate.',
    'Abaixe o fogo e adicione o creme de leite (não deixe ferver forte).',
    'Acerte o sal e sirva com batata palha por cima.',
  ],
  'Estrogonofe de carne': [
    'Corte o acém em tirinhas e tempere; sele em fogo alto.',
    'Refogue cebola e acrescente molho de tomate.',
    'Abaixe o fogo e junte o creme de leite, sem deixar talhar.',
    'Acerte o sal e finalize com batata palha.',
  ],
  'Arroz carreteiro': [
    'Refogue a carne moída e a calabresa com cebola.',
    'Junte o arroz lavado e misture bem.',
    'Acrescente água quente na medida do arroz e tempere.',
    'Cozinhe até secar e o arroz ficar soltinho.',
  ],
  'Baião de dois': [
    'Refogue calabresa e bacon; junte cebola.',
    'Acrescente o arroz e o feijão já cozido (com um pouco do caldo).',
    'Misture e ajuste o sal.',
    'Cozinhe até secar; finalize com cheiro-verde, se tiver.',
  ],
  'Galinhada': [
    'Doure o frango em cubos temperado.',
    'Junte cebola e cenoura, refogue.',
    'Acrescente o arroz, misture e cubra com água quente.',
    'Cozinhe até secar; sirva bem quente.',
  ],
  'Virado simples': [
    'Cozinhe o arroz branco soltinho.',
    'Refogue o feijão e engrosse com farinha de mandioca (tutu/virado).',
    'Refogue a couve fatiada fininha com alho.',
    'Sirva o arroz, o feijão e a couve juntos no prato.',
  ],
  'Yakisoba simples': [
    'Cozinhe o macarrão e reserve.',
    'Sele o frango em tiras na frigideira/wok bem quente.',
    'Junte cenoura, repolho e legumes (deixe crocantes).',
    'Acrescente o macarrão e o shoyu; misture e sirva.',
  ],
  'Panqueca de carne': [
    'Bata farinha, ovos, leite e sal até virar massa lisa; faça os discos.',
    'Prepare a carne moída refogada como recheio.',
    'Recheie e enrole cada panqueca.',
    'Cubra com molho de tomate e leve ao forno para esquentar.',
  ],
  'Panqueca de frango': [
    'Bata farinha, ovos, leite e sal e faça os discos finos.',
    'Recheie com frango desfiado refogado.',
    'Enrole as panquecas e arrume na assadeira.',
    'Cubra com molho e gratine no forno.',
  ],
  'Macarronada com carne moída': [
    'Cozinhe o macarrão al dente em água com sal; escorra.',
    'Prepare a carne moída ao molho de tomate.',
    'Misture o macarrão ao molho.',
    'Sirva quente, com queijo ralado se tiver.',
  ],

  /* ----------------------- Guarnições / acompanhamentos ---------------- */
  'Arroz branco': [
    'Refogue o alho no óleo até dourar levemente.',
    'Junte o arroz lavado e refogue rapidamente.',
    'Acrescente água quente (cerca de 2x o volume do arroz) e sal.',
    'Cozinhe tampado em fogo baixo até secar.',
  ],
  'Feijão carioca': [
    'Cozinhe o feijão na pressão até ficar macio.',
    'Refogue alho, cebola e bacon (opcional) à parte.',
    'Junte parte do feijão ao refogado e amasse para encorpar.',
    'Volte tudo à panela, acerte o sal e deixe apurar.',
  ],
  'Feijão preto': [
    'Cozinhe o feijão preto na pressão até macio.',
    'Refogue alho, cebola e bacon (opcional).',
    'Misture ao feijão e amasse um pouco do caldo.',
    'Apure em fogo baixo até engrossar.',
  ],
  'Purê de batata': [
    'Cozinhe as batatas até ficarem bem macias; escorra.',
    'Amasse ainda quentes.',
    'Acrescente leite (e creme de leite) aos poucos, mexendo.',
    'Acerte o sal até virar um purê liso e cremoso.',
  ],
  'Farofa': [
    'Refogue cebola (e bacon, se usar) na manteiga ou óleo.',
    'Acrescente a farinha de mandioca aos poucos.',
    'Mexa sempre, em fogo baixo, até dourar.',
    'Acerte o sal e sirva.',
  ],
  'Macarrão alho e óleo': [
    'Cozinhe o macarrão al dente; escorra.',
    'Doure bastante alho fatiado no óleo (sem queimar).',
    'Junte o macarrão e misture bem.',
    'Finalize com salsinha e sal a gosto.',
  ],
  'Legumes refogados': [
    'Corte cenoura, abobrinha e chuchu em cubos.',
    'Refogue com alho e um pouco de óleo.',
    'Tampe e cozinhe no próprio vapor até ficarem macios mas firmes.',
    'Acerte o sal e finalize com cheiro-verde.',
  ],
  'Polenta': [
    'Ferva água com sal.',
    'Acrescente o fubá em chuva, mexendo sem parar para não empelotar.',
    'Cozinhe em fogo baixo, mexendo, até engrossar.',
    'Finalize com um fio de óleo ou manteiga.',
  ],
  'Creme de milho': [
    'Bata o milho com o leite no liquidificador.',
    'Leve ao fogo, mexendo, até engrossar.',
    'Acrescente o creme de leite e acerte o sal.',
    'Cozinhe mais um pouco e sirva cremoso.',
  ],

  /* ------------------------------- Saladas ----------------------------- */
  'Vinagrete': [
    'Pique tomate, cebola e pimentão bem miúdos.',
    'Tempere com vinagre, sal e um fio de óleo.',
    'Misture e deixe descansar para apurar o sabor.',
  ],
  'Salpicão simples': [
    'Cozinhe e desfie o frango.',
    'Junte cenoura ralada e milho.',
    'Misture com maionese e acerte o sal.',
    'Sirva gelado; batata palha por cima na hora de servir.',
  ],
  'Maionese de legumes': [
    'Cozinhe batata e cenoura em cubos até ficarem macias; escorra e esfrie.',
    'Junte ovos cozidos picados.',
    'Misture com maionese e acerte o sal.',
    'Sirva bem gelada.',
  ],

  /* ------------------------------ Sobremesas --------------------------- */
  'Arroz doce': [
    'Cozinhe o arroz com água até amaciar.',
    'Acrescente o leite e cozinhe em fogo baixo, mexendo.',
    'Junte o leite condensado e mexa até cremoso.',
    'Finalize com canela (e coco ralado, se usar).',
  ],
  'Salada de frutas': [
    'Pique as frutas em cubos do mesmo tamanho.',
    'Misture com cuidado numa tigela.',
    'Use um pouco de suco de laranja para não escurecer.',
    'Sirva gelada.',
  ],
};

export const PREPAROS: Record<string, string[]> = Object.fromEntries(
  Object.entries(LISTA).map(([nome, passos]) => [norm(nome), passos]),
);

/** Passo a passo do prato (por nome), ou null se não houver. */
export function preparoDoPrato(prato: string | null | undefined): string[] | null {
  return PREPAROS[norm(prato)] ?? null;
}
