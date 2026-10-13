import { compareSearching, SEARCHING_ALGORITHMS } from "./evaluation";
import type { SearchingAlgorithm, SearchingInput, SearchingResult } from "./evaluation";
import { parseSearchingInput } from "./input";
import { SEARCHING_REGISTRY } from "./registry";

export interface SearchingComparisonResult {
  input: SearchingInput;
  rows: SearchingResult[];
}
/** UI comparisons require 2–4 distinct algorithms; core evaluation also supports single runs. */
export function runSearchingComparison(values: string, target: string, algorithms: readonly SearchingAlgorithm[]): SearchingComparisonResult {
  if (algorithms.length < 2 || algorithms.length > 4 || new Set(algorithms).size !== algorithms.length
    || algorithms.some(key => !SEARCHING_ALGORITHMS.includes(key))) throw new Error("invalid_selection");
  const input = parseSearchingInput(values, target);
  const rows = compareSearching(input, algorithms.map(algorithm => ({ algorithm, search: SEARCHING_REGISTRY[algorithm] })));
  return { input, rows };
}
