import { snapshotStringSearchInput } from "./evaluation";
import type { StringSearchInput, StringSearchResult } from "./evaluation";
export interface StringSearchSnapshot { input: StringSearchInput; results: readonly StringSearchResult[] }
/** Detached, immutable snapshot; errors never gain invented measurements. */
export function captureStringSearch(input: StringSearchInput, results: readonly StringSearchResult[]): StringSearchSnapshot {
  return Object.freeze({input: snapshotStringSearchInput(input), results: Object.freeze(results.map(row =>
    Object.freeze(row.status === "completed" ? {...row, alignments: Object.freeze([...row.alignments]), occurrenceIndexes: Object.freeze([...row.occurrenceIndexes])} : {...row}))) });
}
