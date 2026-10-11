import type { Language } from "../../i18n/translations";
import type { ExperimentPage } from "../../types/experiment";
import { experimentTexts } from "../../i18n/experiment";

export function HistoryPage({ data, language, busy, onOpen }: {
  data: ExperimentPage; language: Language; busy: boolean; onOpen: (id: number) => void;
}) {
  const t = experimentTexts[language];
  if (!data.results.length) return <p>{t.historyEmpty}</p>;
  return <ul className="experiment-history">{data.results.map(item => <li key={item.id}>
    <button type="button" disabled={busy} onClick={() => onOpen(item.id)}>{t.open} #{item.id} · {item.name}</button>
    <span>{item.family === "pathfinding" ? "Pathfinding" : "Sorting"} · {t.states[item.status]}</span>
    <small>{t.created}: <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString(language)}</time> · {t.updated}: <time dateTime={item.updated_at}>{new Date(item.updated_at).toLocaleString(language)}</time></small>
  </li>)}</ul>;
}
