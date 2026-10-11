import type { ExperimentByFamily, Experiment } from "../src/types/experiment";
import type { StoredResult } from "../src/evaluation/contracts";
declare const sorting: ExperimentByFamily["sorting"];
declare const pathfinding: ExperimentByFamily["pathfinding"];
// @ts-expect-error Pathfinding metrics cannot masquerade as sorting timings.
const wrongSorting: typeof sorting.results[number]["measurement"] = pathfinding.results[0].measurement;
// @ts-expect-error Sorting metrics do not satisfy pathfinding result contracts.
const wrongPath: typeof pathfinding.results[number]["measurement"] = sorting.results[0].measurement;
const stored: StoredResult<{name:string}, {cost:number}> = {id:1,created_at:"",implementation_snapshot:{name:"Example"},measurement:{cost:1}};
function narrow(experiment: Experiment) {
  if (experiment.family === "pathfinding") return experiment.input_snapshot.grid;
  return experiment.results[0]?.measurement.timings_ns;
}
void [wrongSorting,wrongPath,stored,narrow];
