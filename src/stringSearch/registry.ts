import { naive } from "./naive";
import { kmp } from "./kmp";
import { rabinKarp } from "./rabinKarp";
import { boyerMoore } from "./boyerMoore";
import type { PrepareStringSearch, StringSearchAlgorithm } from "./evaluation";
export const STRING_SEARCH_REGISTRY: Readonly<Record<StringSearchAlgorithm, PrepareStringSearch>> = Object.freeze({naive, kmp, rabinKarp, boyerMoore});
export const STRING_SEARCH_NAMES = Object.freeze({naive:"Naive",kmp:"KMP",rabinKarp:"Rabin-Karp",boyerMoore:"Boyer-Moore (bad-character)"});
