import type { SearchingSearch } from "./evaluation";

/** Ascending validated input; deterministic floor(sqrt(n)) blocks, minimum one. */
export const jump: SearchingSearch = ({ values, target }, observe) => {
  const probes: number[] = [];
  const step = Math.max(1, Math.floor(Math.sqrt(values.length)));
  for (let start = 0; start < values.length; start += step) {
    const end = Math.min(start + step, values.length) - 1;
    probes.push(end);
    observe?.({ probe: end, low: start, high: end, phase: "jump" });
    // One order comparison at the block end; skipped blocks cannot contain target.
    if (values[end] < target) continue;
    for (let index = start; index <= end; index++) {
      probes.push(index);
      observe?.({ probe: index, low: start, high: end, phase: "scan" });
      if (values[index] === target) return { index, probes, comparisons: probes.length };
    }
    return { index: null, probes, comparisons: probes.length };
  }
  return { index: null, probes, comparisons: probes.length };
};
