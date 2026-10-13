import { snapshotSearchingInput } from "./evaluation";
import type { SearchingInput } from "./evaluation";

export function parseSearchingInput(values: string, target: string, limit = 10000): SearchingInput {
  const tokens = values.trim() ? values.trim().split(/[\s,]+/) : [];
  if (!target.trim() || tokens.length > limit || tokens.some(token => !token)) throw new Error("invalid_searching_input");
  return snapshotSearchingInput({ values: tokens.map(Number), target: Number(target) });
}
