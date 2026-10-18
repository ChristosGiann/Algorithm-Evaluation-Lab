import { compareStringSearch, snapshotStringSearchInput } from "./evaluation";
import type { StringSearchAlgorithm, StringSearchInput, StringSearchResult } from "./evaluation";
import { STRING_SEARCH_REGISTRY } from "./registry";
export interface StringSearchComparisonResult { input: StringSearchInput; rows: StringSearchResult[] }
export function runStringSearchComparison(text: string, pattern: string, algorithms: readonly StringSearchAlgorithm[]): StringSearchComparisonResult {
  const input = snapshotStringSearchInput({text, pattern, mode: "first"});
  if (algorithms.length < 1 || algorithms.some(key => !Object.hasOwn(STRING_SEARCH_REGISTRY, key))) throw new Error("invalid_selection");
  return {input, rows: compareStringSearch(input, algorithms.map(algorithm => ({algorithm, prepare: STRING_SEARCH_REGISTRY[algorithm]})))};
}
