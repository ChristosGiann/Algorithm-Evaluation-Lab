import type { PrepareStringSearch } from "./evaluation";

// All intermediates remain below 2^53 for UTF-16 code units: exact JS integers.
export const HASH_BASE = 257;
export const HASH_MODULUS = 1_000_003;
export const rabinKarp: PrepareStringSearch = pattern => {
  let patternHash = 0, power = 1;
  for (let i = 0; i < pattern.length; i++) {
    patternHash = (patternHash * HASH_BASE + pattern.charCodeAt(i) + 1) % HASH_MODULUS;
    if (i) power = (power * HASH_BASE) % HASH_MODULUS;
  }
  return { comparisons: 0, search(text, observe) {
    const alignments: number[] = [];
    let comparisons = 0, windowHash = 0;
    if (!pattern.length) return { index: 0, alignments: [0], comparisons };
    if (pattern.length > text.length) return { index: null, alignments, comparisons };
    for (let i = 0; i < pattern.length; i++) windowHash = (windowHash * HASH_BASE + text.charCodeAt(i) + 1) % HASH_MODULUS;
    for (let offset = 0; offset <= text.length - pattern.length; offset++) {
      alignments.push(offset);
      observe?.({ phase: "hash", offset, windowHash, patternHash, equal: windowHash === patternHash });
      if (windowHash === patternHash) {
        let position = 0;
        for (; position < pattern.length; position++) {
          comparisons++;
          const equal = text[offset + position] === pattern[position];
          observe?.({ phase: "compare", offset, textIndex: offset + position, patternIndex: position, equal });
          if (!equal) break;
        }
        if (position === pattern.length) return { index: offset, alignments, comparisons };
      }
      if (offset < text.length - pattern.length) {
        const removed = ((text.charCodeAt(offset) + 1) * power) % HASH_MODULUS;
        windowHash = ((windowHash - removed + HASH_MODULUS) * HASH_BASE + text.charCodeAt(offset + pattern.length) + 1) % HASH_MODULUS;
      }
    }
    return { index: null, alignments, comparisons };
  } };
};
