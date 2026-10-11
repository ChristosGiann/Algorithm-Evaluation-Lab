/** Literal, case-sensitive UTF-16 code-unit matching, without normalization. */
export const STRING_SEARCH_ALGORITHMS = ["naive", "kmp", "rabinKarp", "boyerMoore"] as const;
export type StringSearchAlgorithm = typeof STRING_SEARCH_ALGORITHMS[number];
export const MAX_TEXT_LENGTH = 10000;
export const MAX_PATTERN_LENGTH = 1000;
export const MAX_ALIGNMENTS = 100000;
export interface StringSearchInput {
  readonly text: string;
  readonly pattern: string;
  readonly mode: "first";
}
export interface StringSearchTrace {
  readonly index: number | null;
  readonly comparisons: number;
  /** Pattern start offsets considered, in execution order (repeats allowed). */
  readonly alignments: readonly number[];
}
export interface PreparedStringSearch {
  readonly comparisons: number;
  /** One prepared pattern, one text; no cache reuse between evaluation entries. */
  readonly search: (text: string) => StringSearchTrace;
}
export type PrepareStringSearch = (pattern: string) => PreparedStringSearch;
export type StringSearchResult = { algorithm: StringSearchAlgorithm; mode: "first" } & (
  | { status: "completed"; found: boolean; correct: boolean; index: number | null;
      occurrenceIndexes: readonly number[]; preprocessingTimeMs: number; executionTimeMs: number;
      preprocessingComparisons: number; comparisons: number; alignments: readonly number[] }
  | { status: "error"; error: "preprocessing_error" | "runner_error" | "invalid_result" | "invalid_clock" }
);

export function snapshotStringSearchInput(input: StringSearchInput): StringSearchInput {
  if (!input || typeof input.text !== "string" || typeof input.pattern !== "string"
    || input.text.length > MAX_TEXT_LENGTH || input.pattern.length > MAX_PATTERN_LENGTH
    || input.mode !== "first") throw new Error("invalid_string_search_input");
  return Object.freeze({ text: input.text, pattern: input.pattern, mode: input.mode });
}

const validCount = (value: number) => Number.isSafeInteger(value) && value >= 0;
const validDuration = (start: number, end: number) =>
  Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(end - start) && end >= start;

function validTrace(input: StringSearchInput, trace: StringSearchTrace): boolean {
  if (!trace || !validCount(trace.comparisons) || !Array.isArray(trace.alignments)
    || trace.alignments.length > MAX_ALIGNMENTS) return false;
  const validOffset = (offset: number) => Number.isInteger(offset) && offset >= 0
    && offset <= input.text.length - input.pattern.length;
  if (![...trace.alignments].every(validOffset)) return false;
  return trace.index === null || (validOffset(trace.index) && trace.alignments.includes(trace.index));
}

/** Validation/oracle/rendering excluded; prepare and search measured separately. */
export function evaluateStringSearch(
  algorithm: StringSearchAlgorithm, input: StringSearchInput, prepare: PrepareStringSearch,
  clock: () => number = () => performance.now(),
): StringSearchResult {
  if (!STRING_SEARCH_ALGORITHMS.includes(algorithm)) throw new Error("unknown_algorithm");
  const fresh = snapshotStringSearchInput(input);
  const identity = { algorithm, mode: fresh.mode };
  let prepared: PreparedStringSearch;
  const preparationStart = clock();
  try { prepared = prepare(fresh.pattern); }
  catch { return { ...identity, status: "error", error: "preprocessing_error" }; }
  const preparationEnd = clock();
  if (!validDuration(preparationStart, preparationEnd)) {
    return { ...identity, status: "error", error: "invalid_clock" };
  }
  if (!prepared || !validCount(prepared.comparisons) || typeof prepared.search !== "function") {
    return { ...identity, status: "error", error: "invalid_result" };
  }
  const preprocessingComparisons = prepared.comparisons;
  let trace: StringSearchTrace;
  const searchStart = clock();
  try { trace = prepared.search(fresh.text); }
  catch { return { ...identity, status: "error", error: "runner_error" }; }
  const searchEnd = clock();
  if (!validDuration(searchStart, searchEnd)) {
    return { ...identity, status: "error", error: "invalid_clock" };
  }
  if (!validTrace(fresh, trace)) return { ...identity, status: "error", error: "invalid_result" };
  const expected = fresh.text.indexOf(fresh.pattern);
  return {
    ...identity, status: "completed", found: trace.index !== null,
    correct: trace.index === (expected === -1 ? null : expected), index: trace.index,
    occurrenceIndexes: Object.freeze(trace.index === null ? [] : [trace.index]),
    preprocessingTimeMs: preparationEnd - preparationStart, executionTimeMs: searchEnd - searchStart,
    preprocessingComparisons, comparisons: trace.comparisons,
    alignments: Object.freeze([...trace.alignments]),
  };
}

export function compareStringSearch(
  input: StringSearchInput,
  entries: readonly { algorithm: StringSearchAlgorithm; prepare: PrepareStringSearch }[],
  clock?: () => number,
): StringSearchResult[] {
  const snapshot = snapshotStringSearchInput(input);
  if (!entries.length || entries.length > STRING_SEARCH_ALGORITHMS.length
    || new Set(entries.map(entry => entry.algorithm)).size !== entries.length
    || entries.some(entry => !STRING_SEARCH_ALGORITHMS.includes(entry.algorithm))) {
    throw new Error("invalid_selection");
  }
  return entries.map(({ algorithm, prepare }) => evaluateStringSearch(algorithm, snapshot, prepare, clock));
}
