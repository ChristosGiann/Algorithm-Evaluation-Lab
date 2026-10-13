import { isSortedAscending, SEARCHING_DEFINITIONS, snapshotSearchingInput } from "./evaluation";
import type { SearchingAlgorithm, SearchingInput, SearchingProbe } from "./evaluation";
import { SEARCHING_REGISTRY } from "./registry";

export function parseSearchingInput(values: string, target: string, limit = 10000): SearchingInput {
  const tokens = values.trim() ? values.trim().split(/[\s,]+/) : [];
  if (!target.trim() || tokens.length > limit || tokens.some(token => !token)) throw new Error("invalid_searching_input");
  return snapshotSearchingInput({ values: tokens.map(Number), target: Number(target) });
}
export interface SearchingFrame {
  readonly phase: SearchingProbe["phase"] | "initial" | "done";
  readonly probe: number | null;
  readonly low: number | null;
  readonly high: number | null;
}
export interface SearchingAnimation {
  readonly input: SearchingInput;
  readonly frames: readonly SearchingFrame[];
  readonly index: number | null;
}
/** Educational observation only: no clock, no benchmark metrics, at most 64 items. */
export function searchingAnimation(algorithm: SearchingAlgorithm, input: SearchingInput): SearchingAnimation {
  const fresh = snapshotSearchingInput(input);
  if (fresh.values.length > 64) throw new Error("invalid_searching_input");
  if (!Object.hasOwn(SEARCHING_REGISTRY, algorithm)) throw new Error("unknown_algorithm");
  if (SEARCHING_DEFINITIONS[algorithm].requiresSorted && !isSortedAscending(fresh.values)) throw new Error("requires_sorted_input");
  const frames: SearchingFrame[] = [{phase:"initial",probe:null,low:null,high:null}];
  const result = SEARCHING_REGISTRY[algorithm](fresh, probe => frames.push(Object.freeze({...probe})));
  frames.push({phase:"done",probe:result.index,low:null,high:null});
  return Object.freeze({input:fresh,frames:Object.freeze(frames.map(frame=>Object.freeze(frame))),index:result.index});
}
export interface SearchingPlayback { animation: SearchingAnimation | null; index: number; playing: boolean }
export type PlaybackAction = {type:"load";animation:SearchingAnimation} | {type:"clear"|"reset"|"play"|"pause"|"step"|"tick"};
export const emptySearchingPlayback: SearchingPlayback = {animation:null,index:0,playing:false};
export function searchingPlayback(state:SearchingPlayback, action:PlaybackAction):SearchingPlayback {
  if(action.type==="load")return {animation:action.animation,index:0,playing:false};
  if(action.type==="clear")return emptySearchingPlayback;
  if(action.type==="reset")return {...state,index:0,playing:false};
  if(action.type==="pause")return {...state,playing:false};
  if(!state.animation)return state;
  const last=state.animation.frames.length-1;
  if(action.type==="play")return {...state,playing:state.index<last};
  if((action.type==="tick"&&!state.playing)||(action.type==="step"&&state.playing))return state;
  const index=Math.min(state.index+1,last);
  return {...state,index,playing:state.playing&&index<last};
}
