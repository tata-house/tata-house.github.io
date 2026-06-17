/* =====================================================================
   Tags de textura/perfil dos pratos — usado pelo radar de monotonia para
   detectar semanas com textura repetitiva (cremoso 3×, ensopado 4×, etc).
   Indexado por nome normalizado, como o restante do app. Sem imports
   externos para evitar dependências circulares.
   ===================================================================== */

function norm(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export type TagPrato = {
  textura: 'cremoso' | 'ensopado' | 'seco' | 'crocante' | 'leve';
};

const LISTA: Record<string, TagPrato> = {
  /* ----------------------------- Principais ---------------------------- */
  'Frango grelhado':                { textura: 'seco' },
  'Frango ao molho':                { textura: 'ensopado' },
  'Frango xadrez':                  { textura: 'crocante' },
  'Frango ensopado':                { textura: 'ensopado' },
  'Carne moída':               { textura: 'seco' },
  'Carne de panela':                { textura: 'ensopado' },
  'Bife acebolado':                 { textura: 'seco' },
  'Almôndegas':                { textura: 'ensopado' },
  'Filé de peixe':             { textura: 'crocante' },
  'Peixe assado':                   { textura: 'seco' },
  'Omelete':                        { textura: 'leve' },
  'Ovos mexidos':                   { textura: 'leve' },
  'Linguíça acebolada':   { textura: 'seco' },
  'Escondidinho de carne':          { textura: 'cremoso' },
  'Estrogonofe de frango':          { textura: 'cremoso' },
  'Estrogonofe de carne':           { textura: 'cremoso' },
  'Arroz carreteiro':               { textura: 'seco' },
  'Baião de dois':             { textura: 'seco' },
  'Galinhada':                      { textura: 'ensopado' },
  'Virado simples':                 { textura: 'seco' },
  'Yakisoba simples':               { textura: 'crocante' },
  'Panqueca de carne':              { textura: 'cremoso' },
  'Panqueca de frango':             { textura: 'cremoso' },
  'Macarronada com carne moída': { textura: 'ensopado' },
};

export const TAGS: Record<string, TagPrato> = Object.fromEntries(
  Object.entries(LISTA).map(([nome, tags]) => [norm(nome), tags]),
);

/** Tags de textura/perfil do prato (por nome), ou null se não catalogado. */
export function tagsDoPrato(prato: string | null | undefined): TagPrato | null {
  if (!prato) return null;
  return TAGS[norm(prato)] ?? null;
}
