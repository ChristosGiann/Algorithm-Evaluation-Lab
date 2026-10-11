/** Shared identity/storage envelope; measurements stay family-specific. */
export interface StoredResult<Identity, Measurement> {
  id: number;
  implementation_snapshot: Identity;
  measurement: Measurement;
  created_at: string;
}
export type ExperimentStatus = "draft" | "pending" | "running" | "completed" | "failed";
export interface ExperimentHeader<Status extends ExperimentStatus = ExperimentStatus> {
  id: number;
  name: string;
  status: Status;
  execution_error: string;
}
