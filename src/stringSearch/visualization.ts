import { snapshotStringSearchInput } from "./evaluation";
import type { StringSearchAlgorithm, StringSearchInput, StringSearchStep } from "./evaluation";
import { STRING_SEARCH_REGISTRY } from "./registry";
export type StringSearchFrame = StringSearchStep | { readonly phase: "initial" | "done"; readonly offset: number };
export interface StringSearchAnimation {
  readonly input: StringSearchInput;
  readonly frames: readonly StringSearchFrame[];
  readonly index: number | null;
}
/** Educational trace only: bounded input and no calls to evaluation clocks. */
export function stringSearchAnimation(algorithm: StringSearchAlgorithm, input: StringSearchInput): StringSearchAnimation {
  const fresh = snapshotStringSearchInput(input);
  if (fresh.text.length > 64 || fresh.pattern.length > 16) throw new Error("invalid_string_search_input");
  if (!Object.hasOwn(STRING_SEARCH_REGISTRY, algorithm)) throw new Error("unknown_algorithm");
  const frames: StringSearchFrame[] = [{phase:"initial",offset:0}];
  const result = STRING_SEARCH_REGISTRY[algorithm](fresh.pattern).search(fresh.text, step => frames.push(Object.freeze({...step})));
  frames.push({phase:"done",offset:result.index ?? frames.at(-1)!.offset});
  return Object.freeze({input:fresh,frames:Object.freeze(frames.map(frame=>Object.freeze(frame))),index:result.index});
}
/** Show code units explicitly so surrogate halves and whitespace retain their offsets. */
export function codeUnitLabel(unit: string): string {
  const code = unit.charCodeAt(0);
  return code <= 32 || (code >= 0xd800 && code <= 0xdfff) || code === 127
    ? "U+" + code.toString(16).toUpperCase().padStart(4,"0") : unit;
}
export interface StringSearchPlayback { animation: StringSearchAnimation | null; index: number; playing: boolean }
export type PlaybackAction = {type:"load";animation:StringSearchAnimation} | {type:"clear"|"reset"|"play"|"pause"|"step"|"tick"};
export const emptyStringSearchPlayback: StringSearchPlayback = {animation:null,index:0,playing:false};
export function stringSearchPlayback(state:StringSearchPlayback, action:PlaybackAction):StringSearchPlayback {
  if(action.type==="load")return {animation:action.animation,index:0,playing:false};
  if(action.type==="clear")return emptyStringSearchPlayback;
  if(action.type==="reset")return {...state,index:0,playing:false};
  if(action.type==="pause")return {...state,playing:false};
  if(!state.animation)return state;
  const last=state.animation.frames.length-1;
  if(action.type==="play")return {...state,playing:state.index<last};
  if((action.type==="tick"&&!state.playing)||(action.type==="step"&&state.playing))return state;
  const index=Math.min(state.index+1,last);
  return {...state,index,playing:state.playing&&index<last};
}
