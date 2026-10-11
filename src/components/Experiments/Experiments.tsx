import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Language } from "../../i18n/translations";
import { experimentTexts } from "../../i18n/experiment";
import { benchmarkTexts } from "../../i18n/benchmark";
import { createExperiment, getAlgorithms, getExperiment, runExperiment } from "../../services/apiClient";
import type { Experiment } from "../../types/experiment";
import type { DatasetType } from "../../types/benchmark";
import { ExperimentHistory } from "./ExperimentHistory";
import { ExperimentDetails } from "./ExperimentDetails";
import "./Experiments.css";

type Choice = { id: number; label: string };
type Feedback = "invalid" | "invalidId" | "error" | "uncertain" | "saveError";

export function Experiments({ language }: { language: Language }) {
  const t = experimentTexts[language];
  const b = benchmarkTexts[language];
  const [choices, setChoices] = useState<Choice[]>([]);
  const [catalogue, setCatalogue] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [size, setSize] = useState("100");
  const [seed, setSeed] = useState("42");
  const [dataset, setDataset] = useState<DatasetType>("random");
  const [lookup, setLookup] = useState("");
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const active = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getAlgorithms(AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]))
      .then(items => {
        if (controller.signal.aborted) return;
        setChoices(items.flatMap(algorithm => algorithm.implementations.filter(item => item.executable)
          .map(item => ({ id: item.id, label: `${algorithm.name} · ${item.name}` }))));
        setCatalogue("ready");
      }).catch(() => { if (!controller.signal.aborted) setCatalogue("error"); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => () => active.current?.abort(), []);

  async function request(action: "save" | "open" | "run", operation: (signal: AbortSignal) => Promise<Experiment>) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await operation(AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]));
      if (!controller.signal.aborted) {
        setExperiment(result); setLookup(String(result.id)); setNeedsRefresh(false);
        if (action !== "open") setHistoryVersion(value => value + 1);
      }
    } catch {
      if (!controller.signal.aborted) {
        setFeedback(action === "run" ? "uncertain" : action === "save" ? "saveError" : "error");
        if (action === "run") setNeedsRefresh(true);
      }
    } finally {
      active.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const count = Number(size), randomSeed = Number(seed);
    if (!name.trim() || name.trim().length > 200 || !selected.length || selected.length > 4 ||
        !size.trim() || !seed.trim() || !Number.isInteger(count) || count < 1 || count > 1000 ||
        !Number.isInteger(randomSeed) || randomSeed < -2147483648 || randomSeed > 2147483647) {
      setFeedback("invalid"); return;
    }
    void request("save", signal => createExperiment({ name: name.trim(), implementation_ids: selected,
      datasets: [{ dataset_type: dataset, size: count, seed: randomSeed }] }, signal));
  }
  function open(event: FormEvent) {
    event.preventDefault();
    const id = Number(lookup);
    if (!Number.isSafeInteger(id) || id < 1) { setFeedback("invalidId"); return; }
    void request("open", signal => getExperiment(id, signal));
  }
  return <section className="experiments" aria-labelledby="experiments-title" aria-busy={busy}>
    <h2 id="experiments-title">{t.title}</h2><p>{t.description}</p>
    <form onSubmit={save}>
      <fieldset disabled={busy}>
        <label>{t.name}<input required maxLength={200} value={name} onChange={event => setName(event.target.value)} /></label>
        <fieldset><legend>{t.implementations}</legend>
          {catalogue === "loading" && <p role="status">{t.loading}</p>}
          {catalogue === "error" && <p role="alert">{t.loadError} <button type="button" onClick={() => { setCatalogue("loading"); setRetry(value => value + 1); }}>{t.retry}</button></p>}
          {catalogue === "ready" && !choices.length && <p>{t.empty}</p>}
          {choices.map(item => <label className="experiments__choice" key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(previous => event.target.checked ? [...previous, item.id] : previous.filter(id => id !== item.id))} />{item.label}</label>)}
        </fieldset>
        <div className="experiments__fields">
          <label>{b.dataset}<select value={dataset} onChange={event => setDataset(event.target.value as DatasetType)}>{Object.entries(b.types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>{b.size}<input type="number" required min={1} max={1000} step={1} value={size} onChange={event => setSize(event.target.value)} /></label>
          <label>{b.seed}<input type="number" required min={-2147483648} max={2147483647} step={1} value={seed} onChange={event => setSeed(event.target.value)} /></label>
        </div>
        <button disabled={catalogue !== "ready" || !selected.length} type="submit">{t.save}</button>
      </fieldset>
    </form>
    <p>{t.note}</p>
    <ExperimentHistory key={historyVersion} language={language} busy={busy} onOpen={id => void request("open", signal => getExperiment(id, signal))} />
    <form onSubmit={open}><fieldset disabled={busy} className="experiments__fields">
      <label>{t.id}<input type="number" required min={1} step={1} value={lookup} onChange={event => setLookup(event.target.value)} /></label>
      <button type="submit">{t.open}</button>
    </fieldset></form>
    {busy && <p role="status">{t.busy}</p>}
    {feedback && <p role="alert">{t[feedback]}</p>}
    {experiment && <>
      <div className="experiments__fields">
        <button disabled={busy} onClick={() => void request("open", signal => getExperiment(experiment.id, signal))}>{t.refresh}</button>
        <button disabled={busy || needsRefresh || experiment.family === "pathfinding" || experiment.status !== "draft"} onClick={() => void request("run", signal => runExperiment(experiment.id, signal))}>{t.run}</button>
      </div>
      <ExperimentDetails experiment={experiment} language={language} />
    </>}
  </section>;
}
