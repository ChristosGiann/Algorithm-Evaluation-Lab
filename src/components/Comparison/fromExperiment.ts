import type { Experiment } from "../../types/experiment";
import type { ComparisonResult } from "../../types/comparison";

export function comparisonFromExperiment(experiment: Experiment): ComparisonResult | null {
  if (experiment.family === "pathfinding") return null;
  if (experiment.results.length < 2 || !experiment.results.every(row => row.implementation_snapshot.comparison)) return null;
  const first = experiment.results[0].measurement;
  return { baseline_algorithm: first.baseline_algorithm, dataset_type: first.dataset_type, size: first.size, seed: first.seed,
    results: experiment.results.map(row => ({ algorithm: row.implementation_snapshot.algorithm, status: "completed", measurement: row.measurement })) };
}
