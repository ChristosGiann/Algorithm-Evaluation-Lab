import { compareSearching, SEARCHING_ALGORITHMS } from "./evaluation";
import type { SearchingAlgorithm, SearchingInput, SearchingResult } from "./evaluation";
import { parseSearchingInput } from "./input";
import { SEARCHING_REGISTRY } from "./registry";

export interface SearchingComparisonResult {
  input: SearchingInput;
  rows: SearchingResult[];
}
/** UI supports single runs and comparisons of up to four distinct algorithms. */
export function runSearchingComparison(values: string, target: string, algorithms: readonly SearchingAlgorithm[]): SearchingComparisonResult {
  if (algorithms.length < 1 || algorithms.length > 4 || new Set(algorithms).size !== algorithms.length
    || algorithms.some(key => !SEARCHING_ALGORITHMS.includes(key))) throw new Error("invalid_selection");
  const input = parseSearchingInput(values, target);
  const rows = compareSearching(input, algorithms.map(algorithm => ({ algorithm, search: SEARCHING_REGISTRY[algorithm] })));
  return { input, rows };
}
