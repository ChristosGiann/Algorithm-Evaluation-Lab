import type { SearchingSearch } from "./evaluation";

/** Ascending validated input: use evaluateSearching to enforce the precondition. */
export const binary: SearchingSearch = ({ values, target }) => {
  const probes: number[] = [];
  let comparisons = 0;
  let low = 0, high = values.length - 1;
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const value = values[middle];
    probes.push(middle);
    comparisons++;
    if (value === target) return { index: middle, probes, comparisons };
    comparisons++;
    if (value < target) low = middle + 1;
    else high = middle - 1;
  }
  return { index: null, probes, comparisons };
};
