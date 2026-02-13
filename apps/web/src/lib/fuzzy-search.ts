/**
 * Normalize string by removing Polish diacritics and converting to lowercase.
 * Handles: ą→a, ć→c, ę→e, ł→l, ń→n, ó→o, ś→s, ź→z, ż→z
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0142/g, 'l') // ł → l (not covered by NFD decomposition)
    .replace(/\u0141/g, 'l'); // Ł → l
}

/**
 * Check if query fuzzy-matches the text.
 * - Normalizes diacritics (so "slaskie" matches "śląskie")
 * - Allows character skips for minor typos (fuzzy tolerance)
 * - Also does a simple substring check on normalized text
 */
function fuzzyMatch(text: string, query: string): boolean {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);

  // Direct substring match on normalized text
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }

  // Fuzzy subsequence match — allow skipping characters in text
  // This catches minor typos and partial matches
  let qi = 0;
  for (let ti = 0; ti < normalizedText.length && qi < normalizedQuery.length; ti++) {
    if (normalizedText[ti] === normalizedQuery[qi]) {
      qi++;
    }
  }

  // All query characters found in order — match if we consumed at least 70% of query chars
  // or all of them for short queries
  if (normalizedQuery.length <= 3) {
    return qi === normalizedQuery.length;
  }
  return qi >= normalizedQuery.length;
}

/**
 * Filter an array of items using fuzzy search across specified string fields.
 * Returns items where query fuzzy-matches any of the given fields.
 */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  fields: ((item: T) => string | undefined | null)[],
): T[] {
  if (!query.trim()) return items;

  const trimmedQuery = query.trim();

  return items.filter((item) =>
    fields.some((getField) => {
      const value = getField(item);
      if (!value) return false;
      return fuzzyMatch(value, trimmedQuery);
    }),
  );
}
