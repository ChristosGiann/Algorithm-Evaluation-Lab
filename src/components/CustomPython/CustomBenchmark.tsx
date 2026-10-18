import { useEffect, useRef, useState } from "react";
import type { Language } from "../../i18n/translations";
import type { DatasetType, SortingAlgorithm } from "../../types/benchmark";
import type { ComparisonResult } from "../../types/comparison";
import { benchmarkTexts } from "../../i18n/benchmark";
import { customExecutionTexts } from "../../i18n/customExecution";
import { runCustomBenchmark, runComparison } from "../../services/apiClient";
import { ComparisonResults } from "../Comparison/ComparisonResults";

export function CustomBenchmark({source,language}:{source:string;language:Language}) {
  const t=customExecutionTexts[language], b=benchmarkTexts[language];
  const [trusted,setTrusted]=useState(false),[running,setRunning]=useState(false),[error,setError]=useState(false);
  const [size,setSize]=useState(100),[seed,setSeed]=useState(42),[dataset,setDataset]=useState<DatasetType>("random");
  const [result,setResult]=useState<ComparisonResult|null>(null);
  const [algorithms,setAlgorithms]=useState<SortingAlgorithm[]>([]);
  const denied=result?.results.some(row=>row.status!=="completed"&&row.error==="execution_disabled")??false;
  const active=useRef<AbortController|null>(null);
  useEffect(()=>()=>active.current?.abort(),[]);
  return <section className="benchmark" aria-labelledby="custom-benchmark-title"><h3 id="custom-benchmark-title">{t.title}</h3><p>{t.note}</p>
    <form onSubmit={async event=>{
      event.preventDefault(); if(active.current||denied||!trusted||algorithms.length>4)return;
      const controller=new AbortController();active.current=controller;setRunning(true);setError(false);setResult(null);
      try {
        const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(30000)]);
        const config={size,seed,dataset_type:dataset};
        const response=algorithms.length ? await runComparison({...config,algorithms,custom_source:source,trusted:true},signal)
          : {...config,results:[await runCustomBenchmark({...config,source,trusted:true},signal)]};
        if(!controller.signal.aborted)setResult(response);
      }
      catch {if(!controller.signal.aborted)setError(true);}
      finally {active.current=null;if(!controller.signal.aborted)setRunning(false);}
    }}>
      <fieldset disabled={running||denied}><legend>{t.select}</legend>
        {Object.entries(b.algorithms).map(([slug,label])=><label key={slug}><input type="checkbox" checked={algorithms.includes(slug as SortingAlgorithm)} disabled={algorithms.length>=4&&!algorithms.includes(slug as SortingAlgorithm)} onChange={event=>setAlgorithms(current=>event.target.checked?[...current,slug as SortingAlgorithm]:current.filter(item=>item!==slug))}/>{label}</label>)}
      </fieldset>
      <fieldset className="benchmark__fields" disabled={running||denied}>
        <label>{b.dataset}<select value={dataset} onChange={e=>setDataset(e.target.value as DatasetType)}>{Object.entries(b.types).map(([key,value])=><option value={key} key={key}>{value}</option>)}</select></label>
        <label>{b.size}<input type="number" required min={1} max={1000} step={1} value={size} onChange={e=>setSize(Number(e.target.value))}/></label>
        <label>{b.seed}<input type="number" required min={-2147483648} max={2147483647} step={1} value={seed} onChange={e=>setSeed(Number(e.target.value))}/></label>
        <label><input type="checkbox" checked={trusted} onChange={e=>setTrusted(e.target.checked)}/>{t.trust}</label>
        <button disabled={!trusted||new TextEncoder().encode(source).length>32768}>{algorithms.length?t.compare:t.run}</button>
      </fieldset>
    </form>
    {running && <p role="status">{b.running}</p>}{error && <p role="alert">{t.error}</p>}
    {result?.results.filter(row=>row.status!=="completed").map(row=><p role="alert" key={row.algorithm}>{row.algorithm}: {t[row.error as keyof typeof t] ?? t.error}</p>)}
    {result && <ComparisonResults language={language} result={result}/>}
  </section>;
}
