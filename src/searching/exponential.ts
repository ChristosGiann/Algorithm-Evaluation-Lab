import type { SearchingSearch } from "./evaluation";

/** Ascending validated input, doubling bounds then inclusive binary search. */
export const exponential: SearchingSearch = ({ values, target }) => {
  const probes: number[] = [];
  let comparisons = 0;
  if (!values.length) return { index: null, probes, comparisons };
  probes.push(0);
  comparisons++;
  if (values[0] === target) return { index: 0, probes, comparisons };
  let bound = 1;
  while (bound < values.length) {
    probes.push(bound);
    comparisons++;
    if (values[bound] >= target) break;
    bound *= 2;
  }
  let low = Math.floor(bound / 2), high = Math.min(bound, values.length - 1);
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    probes.push(middle);
    comparisons++;
    if (values[middle] === target) return { index: middle, probes, comparisons };
    comparisons++;
    if (values[middle] < target) low = middle + 1;
    else high = middle - 1;
  }
  return { index: null, probes, comparisons };
};
