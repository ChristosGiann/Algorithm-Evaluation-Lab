import type { PrepareStringSearch } from "./evaluation";

/** Boyer-Moore with bad-character shifts only; no good-suffix/Galil heuristic. */
export const boyerMoore: PrepareStringSearch = pattern => {
  const last = new Map<string, number>();
  for (let i = 0; i < pattern.length; i++) last.set(pattern[i], i);
  return { comparisons: 0, search(text, observe) {
    const alignments: number[] = [];
    let offset = 0, comparisons = 0;
    while (offset <= text.length - pattern.length) {
      alignments.push(offset);
      let position = pattern.length - 1;
      for (; position >= 0; position--) {
        comparisons++;
        const equal = text[offset + position] === pattern[position];
        observe?.({ phase: "compare", offset, textIndex: offset + position, patternIndex: position, equal });
        if (!equal) break;
      }
      if (position < 0) return { index: offset, alignments, comparisons };
      const nextOffset = offset + Math.max(1, position - (last.get(text[offset + position]) ?? -1));
      observe?.({ phase: "shift", offset, nextOffset });
      offset = nextOffset;
    }
    return { index: null, alignments, comparisons };
  } };
};
