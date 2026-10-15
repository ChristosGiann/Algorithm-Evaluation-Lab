import type { SearchingSearch } from "./evaluation";

/** Validated numeric input; one equality comparison per left-to-right probe. */
export const linear: SearchingSearch = ({ values, target }, observe) => {
  const probes: number[] = [];
  for (let index = 0; index < values.length; index++) {
    probes.push(index);
    observe?.({ probe: index, low: index, high: values.length - 1, phase: "scan" });
    if (values[index] === target) return { index, probes, comparisons: probes.length };
  }
  return { index: null, probes, comparisons: probes.length };
};
