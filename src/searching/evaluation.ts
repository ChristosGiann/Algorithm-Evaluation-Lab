/** Numeric array searching; distinct from grid pathfinding and string matching. */
export const SEARCHING_ALGORITHMS = ["linear", "binary", "jump", "exponential"] as const;
export type SearchingAlgorithm = typeof SEARCHING_ALGORITHMS[number];
export const MAX_SEARCHING_SIZE = 10000;
export const MAX_SEARCHING_PROBES = 100000;

export const SEARCHING_DEFINITIONS = Object.freeze({
  linear: Object.freeze({ name: "Linear Search", requiresSorted: false }),
  binary: Object.freeze({ name: "Binary Search", requiresSorted: true }),
  jump: Object.freeze({ name: "Jump Search", requiresSorted: true }),
  exponential: Object.freeze({ name: "Exponential Search", requiresSorted: true }),
});

/** Zero-based original indexes; duplicates allowed, any matching index is valid. */
export interface SearchingInput {
  readonly values: readonly number[];
  readonly target: number;
}
/** One probe is one inspected array position; repeats count again. */
export interface SearchingTrace {
  readonly index: number | null;
  readonly probes: readonly number[];
  /** Number of logical value/target comparisons, excluding loop/index checks. */
  readonly comparisons: number;
}
export interface SearchingProbe {
  readonly probe: number; readonly low: number; readonly high: number;
  readonly phase: "scan" | "binary" | "jump" | "expand";
}
export type SearchingSearch = (input: SearchingInput, observe?: (probe: SearchingProbe) => void) => SearchingTrace;
export type SearchingResult = { algorithm: SearchingAlgorithm } & (
  | { status: "completed"; found: boolean; correct: boolean; index: number | null;
      executionTimeMs: number; probeCount: number; comparisons: number; probes: readonly number[] }
  | { status: "error"; error: "requires_sorted_input" | "runner_error" | "invalid_result" | "invalid_clock" }
);

export function snapshotSearchingInput(input: SearchingInput): SearchingInput {
  if (!input || !Array.isArray(input.values) || input.values.length > MAX_SEARCHING_SIZE
    || [...input.values].some(value => typeof value !== "number" || !Number.isFinite(value))
    || typeof input.target !== "number" || !Number.isFinite(input.target)) {
    throw new Error("invalid_searching_input");
  }
  return Object.freeze({ values: Object.freeze([...input.values]), target: input.target });
}

export function isSortedAscending(values: readonly number[]): boolean {
  return values.every((value, index) => index === 0 || values[index - 1] <= value);
}

function validTrace(input: SearchingInput, trace: SearchingTrace): boolean {
  if (!trace || !Array.isArray(trace.probes) || trace.probes.length > MAX_SEARCHING_PROBES
    || !Number.isSafeInteger(trace.comparisons) || trace.comparisons < trace.probes.length) return false;
  const validIndex = (index: number) => Number.isInteger(index) && index >= 0 && index < input.values.length;
  if (![...trace.probes].every(validIndex)) return false;
  return trace.index === null || (validIndex(trace.index) && trace.probes.includes(trace.index));
}

/** Snapshot, sortedness and correctness checks are outside search-only timing. */
export function evaluateSearching(
  algorithm: SearchingAlgorithm, input: SearchingInput, search: SearchingSearch,
  clock: () => number = () => performance.now(),
): SearchingResult {
  if (!SEARCHING_ALGORITHMS.includes(algorithm)) throw new Error("unknown_algorithm");
  const fresh = snapshotSearchingInput(input);
  if (SEARCHING_DEFINITIONS[algorithm].requiresSorted && !isSortedAscending(fresh.values)) {
    return { algorithm, status: "error", error: "requires_sorted_input" };
  }
  let trace: SearchingTrace;
  const start = clock();
  try { trace = search(fresh); }
  catch { return { algorithm, status: "error", error: "runner_error" }; }
  const end = clock();
  const elapsed = end - start;
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(elapsed) || elapsed < 0) {
    return { algorithm, status: "error", error: "invalid_clock" };
  }
  if (!validTrace(fresh, trace)) return { algorithm, status: "error", error: "invalid_result" };
  const found = trace.index !== null;
  const correct = trace.index === null
    ? !fresh.values.includes(fresh.target)
    : fresh.values[trace.index] === fresh.target;
  return {
    algorithm, status: "completed", found, correct, index: trace.index,
    executionTimeMs: elapsed, probeCount: trace.probes.length, comparisons: trace.comparisons,
    probes: Object.freeze([...trace.probes]),
  };
}

/** No implicit sorting: incompatible entries return an explicit error row. */
export function compareSearching(
  input: SearchingInput,
  entries: readonly { algorithm: SearchingAlgorithm; search: SearchingSearch }[],
  clock?: () => number,
): SearchingResult[] {
  const snapshot = snapshotSearchingInput(input);
  if (!entries.length || entries.length > SEARCHING_ALGORITHMS.length
    || new Set(entries.map(entry => entry.algorithm)).size !== entries.length
    || entries.some(entry => !SEARCHING_ALGORITHMS.includes(entry.algorithm))) {
    throw new Error("invalid_selection");
  }
  return entries.map(({ algorithm, search }) => evaluateSearching(algorithm, snapshot, search, clock));
}
