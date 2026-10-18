import type { ExperimentHeader, StoredResult } from "../evaluation/contracts";
import type { BenchmarkResult, DatasetType } from "./benchmark";
export interface ExperimentInput {
  name: string;
  implementation_ids: number[];
  datasets: { dataset_type: DatasetType; size: number; seed: number }[];
}
export interface SortingExperiment extends ExperimentHeader {
  family?: "sorting";
  implementations: { id: number; name: string; algorithm: string; language: string }[];
  datasets: { id: number; dataset_type: DatasetType; size: number; seed: number }[];
  results: StoredResult<{ comparison?: boolean; id: number; name: string; algorithm: string; language: string }, BenchmarkResult>[];
}

export interface ExperimentSummary {
  id: number; name: string; family?: AlgorithmFamily; status: Experiment["status"]; created_at: string; updated_at: string;
}
export interface ExperimentPage { results: ExperimentSummary[]; next_before: number | null }

export interface PathfindingExperiment extends ExperimentHeader<"completed"> {
  family: "pathfinding";
  implementations: []; datasets: [];
  input_snapshot: {
    version: 1; source: "browser"; movement: "cardinal"; costRule: "enter-cell-exclude-start";
    grid: import("../pathfinding/evaluation").GridInput;
    algorithms: import("../pathfinding/evaluation").PathfindingAlgorithm[];
  };
  results: StoredResult<{algorithm:string; name:string; language:string; version:number},
    import("../pathfinding/evaluation").PathfindingResult>[];
}
export interface SearchingExperiment extends ExperimentHeader<"completed" | "failed"> {
  family: "searching";
  implementations: []; datasets: [];
  input_snapshot: {
    version: 1; source: "browser";
    input: import("../searching/evaluation").SearchingInput;
    algorithms: import("../searching/evaluation").SearchingAlgorithm[];
  };
  results: StoredResult<{algorithm:string; name:string; language:string; version:number},
    import("../searching/evaluation").SearchingResult>[];
}
export interface StringSearchExperiment extends ExperimentHeader<"completed" | "failed"> {
  family: "string_search";
  implementations: []; datasets: [];
  input_snapshot: {
    version: 1; source: "browser";
    input: import("../stringSearch/evaluation").StringSearchInput;
    algorithms: import("../stringSearch/evaluation").StringSearchAlgorithm[];
  };
  results: StoredResult<{algorithm:string; name:string; language:string; version:number},
    import("../stringSearch/evaluation").StringSearchResult>[];
}
/** Add a family here without widening either existing metric contract. */
export interface ExperimentByFamily {
  searching: SearchingExperiment;
  string_search: StringSearchExperiment;
  sorting: SortingExperiment;
  pathfinding: PathfindingExperiment;
}
export type AlgorithmFamily = keyof ExperimentByFamily;
export type Experiment = ExperimentByFamily[AlgorithmFamily];
