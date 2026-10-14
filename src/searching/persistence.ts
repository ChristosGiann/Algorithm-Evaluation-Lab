import { snapshotSearchingInput } from "./evaluation";
import type { SearchingInput, SearchingResult } from "./evaluation";
export interface SearchingSnapshot { input: SearchingInput; results: readonly SearchingResult[] }
/** Detach inputs and metrics from later edits. Error rows intentionally have no metrics. */
export function captureSearching(input: SearchingInput, results: readonly SearchingResult[]): SearchingSnapshot {
  return Object.freeze({ input: snapshotSearchingInput(input), results: Object.freeze(results.map(row =>
    Object.freeze(row.status === "completed" ? {...row, probes: Object.freeze([...row.probes])} : {...row}))) });
}
