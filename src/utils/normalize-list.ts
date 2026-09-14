// ----------------------------------------------------------------------
// A API às vezes devolve a lista já pronta (array puro) e às vezes
// embrulhada em { items: [...] } / { data: [...] } / { results: [...] }
// dependendo do endpoint — uma tela que assume um formato fixo quebra
// (ex.: "o.filter is not a function") assim que o back-end responde no
// outro formato. Esta função aceita os dois e nunca lança, sempre
// devolvendo um array (vazio se não reconhecer o formato).
// ----------------------------------------------------------------------

const KNOWN_KEYS = ['items', 'data', 'results', 'list'];

export function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of KNOWN_KEYS) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
    // Formato desconhecido: usa a primeira propriedade que for um array
    // em vez de assumir uma chave específica e quebrar silenciosamente.
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}
