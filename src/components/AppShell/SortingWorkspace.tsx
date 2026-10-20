import { useState } from "react";
import type { ReactNode } from "react";
import type { Language } from "../../i18n/translations";
import { workspaceTexts } from "../../i18n/workspace";
const TOOLS = ["benchmark", "comparison", "visualization", "custom"] as const;
type Tool = typeof TOOLS[number];
export function SortingWorkspace({ language, panels }: { language: Language; panels: Record<Tool, ReactNode> }) {
  const [active, setActive] = useState<Tool>("benchmark");
  const [visited, setVisited] = useState<Tool[]>(["benchmark"]);
  const t = workspaceTexts[language];
  return <><div className="tool-switcher" role="group" aria-label={t.tools}>
    {TOOLS.map(key => <button key={key} type="button" aria-pressed={active === key} aria-controls={`sorting-${key}`} onClick={() => {
      setActive(key); setVisited(previous => previous.includes(key) ? previous : [...previous, key]);
    }}>{t[key]}</button>)}
  </div>{TOOLS.map(key => <section key={key} id={`sorting-${key}`} aria-label={t[key]} hidden={key !== active}>
    {visited.includes(key) && panels[key]}
  </section>)}</>;
}
