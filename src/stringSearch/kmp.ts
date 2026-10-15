import type { PrepareStringSearch } from "./evaluation";

/** LPS[i]: longest proper prefix also a suffix of pattern[0..i]. */
export function buildLps(pattern: string): { table: readonly number[]; comparisons: number } {
  const table = Array<number>(pattern.length).fill(0);
  let length = 0, position = 1, comparisons = 0;
  while (position < pattern.length) {
    comparisons++;
    if (pattern[position] === pattern[length]) table[position++] = ++length;
    else if (length) length = table[length - 1];
    else position++;
  }
  return { table: Object.freeze(table), comparisons };
}

export const kmp: PrepareStringSearch = pattern => {
  const { table, comparisons } = buildLps(pattern);
  return { comparisons, search(text) {
    const alignments: number[] = [];
    let position = 0, matched = 0, comparisons = 0;
    if (!pattern.length) return { index: 0, alignments: [0], comparisons };
    while (position < text.length && position - matched <= text.length - pattern.length) {
      const offset = position - matched;
      if (alignments.at(-1) !== offset) alignments.push(offset);
      comparisons++;
      if (text[position] === pattern[matched]) {
        position++; matched++;
        if (matched === pattern.length) return { index: position - matched, alignments, comparisons };
      } else if (matched) matched = table[matched - 1];
      else position++;
    }
    return { index: null, alignments, comparisons };
  } };
};
