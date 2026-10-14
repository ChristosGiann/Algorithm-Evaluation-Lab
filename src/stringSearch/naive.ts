import type { PrepareStringSearch } from "./evaluation";

/** Literal UTF-16 first match on validated input; no preprocessing table or cache. */
export const naive: PrepareStringSearch = pattern => ({
  comparisons: 0,
  search(text) {
    const alignments: number[] = [];
    let comparisons = 0;
    for (let offset = 0; offset <= text.length - pattern.length; offset++) {
      alignments.push(offset);
      let position = 0;
      for (; position < pattern.length; position++) {
        comparisons++;
        if (text[offset + position] !== pattern[position]) break;
      }
      // Empty pattern succeeds at offset 0 without character comparisons.
      if (position === pattern.length) return { index: offset, alignments, comparisons };
    }
    return { index: null, alignments, comparisons };
  },
});
