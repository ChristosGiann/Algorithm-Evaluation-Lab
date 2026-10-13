import { linear } from "./linear";
import { binary } from "./binary";
import { jump } from "./jump";
import { exponential } from "./exponential";
import type { SearchingAlgorithm, SearchingSearch } from "./evaluation";
export const SEARCHING_REGISTRY = { linear, binary, jump, exponential } satisfies Record<SearchingAlgorithm, SearchingSearch>;
