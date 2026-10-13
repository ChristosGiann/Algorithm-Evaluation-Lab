import { useEffect, useReducer, useState } from "react";
import type { Language } from "../../i18n/translations";
import { searchingTexts } from "../../i18n/searching";
import { SEARCHING_ALGORITHMS, SEARCHING_DEFINITIONS } from "../../searching/evaluation";
import type { SearchingAlgorithm } from "../../searching/evaluation";
import { emptySearchingPlayback, parseSearchingInput, searchingAnimation, searchingPlayback } from "../../searching/visualization";
import "./Searching.css";

export function SearchingVisualization({language}:{language:Language}) {
  const t=searchingTexts[language];
  const [algorithm,setAlgorithm]=useState<SearchingAlgorithm>("linear");
  const [values,setValues]=useState("1, 3, 5, 7, 9, 11, 13, 15");
  const [target,setTarget]=useState("11"),[speed,setSpeed]=useState(350);
  const [error,setError]=useState<"sorted"|"invalid"|null>(null);
  const [state,dispatch]=useReducer(searchingPlayback,emptySearchingPlayback);
  useEffect(()=>{
    if(!state.playing)return;
    const timer=window.setInterval(()=>dispatch({type:"tick"}),speed);
    return ()=>window.clearInterval(timer);
  },[state.playing,speed]);
  function clear(){dispatch({type:"clear"});setError(null);}
  const frame=state.animation?.frames[state.index];
  const end=!state.animation||state.index===state.animation.frames.length-1;
  const visited=new Set(state.animation?.frames.slice(1,state.index+1).map(item=>item.probe));
  return <section className="benchmark" aria-labelledby="searching-visualization-title">
    <h2 id="searching-visualization-title">{t.title}</h2><p>{t.note}</p>
    <form className="benchmark__fields" onSubmit={event=>{event.preventDefault();clear();try {
      dispatch({type:"load",animation:searchingAnimation(algorithm,parseSearchingInput(values,target,64))});
    }catch(error){setError(error instanceof Error&&error.message==="requires_sorted_input"?"sorted":"invalid");}}}>
      <label>{t.algorithm}<select value={algorithm} onChange={event=>{setAlgorithm(event.target.value as SearchingAlgorithm);clear();}}>
        {SEARCHING_ALGORITHMS.map(key=><option key={key} value={key}>{SEARCHING_DEFINITIONS[key].name}</option>)}
      </select></label>
      <label>{t.values}<input value={values} maxLength={4096} onChange={event=>{setValues(event.target.value);clear();}} /></label>
      <label>{t.target}<input value={target} maxLength={100} onChange={event=>{setTarget(event.target.value);clear();}} /></label>
      <button>{t.load}</button>
    </form>
    {error&&<p role="alert">{t[error]}</p>}
    <div className="benchmark__fields">
      <button disabled={state.playing||end} onClick={()=>dispatch({type:"play"})}>{t.play}</button>
      <button disabled={!state.playing} onClick={()=>dispatch({type:"pause"})}>{t.pause}</button>
      <button disabled={state.playing||end} onClick={()=>dispatch({type:"step"})}>{t.step}</button>
      <button disabled={!state.animation} onClick={()=>dispatch({type:"reset"})}>{t.reset}</button>
      <label>{t.speed}<select value={speed} onChange={event=>setSpeed(Number(event.target.value))}>
        {[1000,350,100].map(ms=><option key={ms} value={ms}>{ms} ms</option>)}
      </select></label>
    </div>
    {frame&&state.animation ? <>
      <p role="status">{t.frame} {state.index} / {state.animation.frames.length-1} · {t.phases[frame.phase]}
        {frame.phase==="done"&&<> · {state.animation.index===null?t.absent:t.found+" "+state.animation.index}</>}
      </p>
      <p>{t.probe}: {frame.probe??"—"} · {t.range}: {frame.low===null?"—":frame.low+"–"+frame.high}</p>
      <p>{t.legend}</p>
      <ol className="searching-cells" aria-label={t.values}>
        {state.animation.input.values.map((value,index)=><li key={index}
          className={[visited.has(index)?"visited":"",frame.probe===index?"current":"",
            frame.low!==null&&frame.high!==null&&index>=frame.low&&index<=frame.high?"range":"",
            frame.phase==="done"&&state.animation?.index===index?"match":""].join(" ")}>
          <span>{value}</span><small>{t.index} {index}</small>
        </li>)}
      </ol>
      <p>{t.visited}: {[...visited].filter(index=>index!==null).join(", ")||"—"}</p>
    </>:<p>{t.empty}</p>}
  </section>;
}
