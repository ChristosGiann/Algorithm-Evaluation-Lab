import { useEffect, useReducer, useState } from "react";
import type { Language } from "../../i18n/translations";
import { stringSearchTexts } from "../../i18n/stringSearch";
import { STRING_SEARCH_ALGORITHMS } from "../../stringSearch/evaluation";
import type { StringSearchAlgorithm } from "../../stringSearch/evaluation";
import { STRING_SEARCH_NAMES } from "../../stringSearch/registry";
import { emptyStringSearchPlayback, stringSearchAnimation, stringSearchPlayback } from "../../stringSearch/visualization";
import { StringSearchFrame } from "./StringSearchFrame";
export function StringSearchVisualization({language}:{language:Language}) {
  const t=stringSearchTexts[language];
  const [algorithm,setAlgorithm]=useState<StringSearchAlgorithm>("naive");
  const [text,setText]=useState("banana"),[pattern,setPattern]=useState("ana"),[speed,setSpeed]=useState(350);
  const [error,setError]=useState(false);
  const [state,dispatch]=useReducer(stringSearchPlayback,emptyStringSearchPlayback);
  useEffect(()=>{
    if(!state.playing)return;
    const timer=window.setInterval(()=>dispatch({type:"tick"}),speed);
    return ()=>window.clearInterval(timer);
  },[state.playing,speed]);
  function clear(){dispatch({type:"clear"});setError(false);}
  const frame=state.animation?.frames[state.index];
  const end=!state.animation||state.index===state.animation.frames.length-1;
  return <section className="benchmark" aria-labelledby="string-search-visualization-title">
    <h2 id="string-search-visualization-title">{t.title}</h2><p>{t.note}</p>
    <form className="benchmark__fields" onSubmit={event=>{event.preventDefault();clear();try {
      dispatch({type:"load",animation:stringSearchAnimation(algorithm,{text,pattern,mode:"first"})});
    }catch{setError(true);}}}>
      <label>{t.algorithm}<select value={algorithm} onChange={event=>{setAlgorithm(event.target.value as StringSearchAlgorithm);clear();}}>{STRING_SEARCH_ALGORITHMS.map(key=><option key={key} value={key}>{STRING_SEARCH_NAMES[key]}</option>)}</select></label>
      <label>{t.text}<input value={text} maxLength={64} onChange={event=>{setText(event.target.value);clear();}} /></label>
      <label>{t.pattern}<input value={pattern} maxLength={16} onChange={event=>{setPattern(event.target.value);clear();}} /></label>
      <button>{t.load}</button>
    </form>
    {error&&<p role="alert">{t.invalid}</p>}
    <div className="benchmark__fields">
      <button disabled={state.playing||end} onClick={()=>dispatch({type:"play"})}>{t.play}</button>
      <button disabled={!state.playing} onClick={()=>dispatch({type:"pause"})}>{t.pause}</button>
      <button disabled={state.playing||end} onClick={()=>dispatch({type:"step"})}>{t.step}</button>
      <button disabled={!state.animation} onClick={()=>dispatch({type:"reset"})}>{t.reset}</button>
      <label>{t.speed}<select value={speed} onChange={event=>setSpeed(Number(event.target.value))}>{[1000,350,100].map(ms=><option key={ms} value={ms}>{ms} ms</option>)}</select></label>
    </div>
    {frame&&state.animation?<>
      <p role="status">{t.frame} {state.index} / {state.animation.frames.length-1} · {t.phases[frame.phase]}{frame.phase==="done"&&<> · {state.animation.index===null?t.absent:t.found+" "+state.animation.index}</>}</p>
      <StringSearchFrame animation={state.animation} frame={frame} language={language} />
    </>:<p>{t.empty}</p>}
  </section>;
}
