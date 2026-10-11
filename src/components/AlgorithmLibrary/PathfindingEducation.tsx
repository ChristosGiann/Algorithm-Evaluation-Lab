import type { Language } from "../../i18n/translations";
import { PATHFINDING_EDUCATION } from "../../pathfinding/education";
import { EducationalContent } from "./EducationalContent";

export function PathfindingEducation({ language }: { language: Language }) {
  return <section aria-labelledby="pathfinding-education-title">
    <h3 id="pathfinding-education-title">Pathfinding</h3>
    <div className="algorithm-library__grid">
      {Object.entries(PATHFINDING_EDUCATION).map(([slug, algorithm]) =>
        <article className="algorithm-card" key={slug}>
          <header className="algorithm-card__header"><h4>{algorithm.name}</h4><code>{slug}</code></header>
          <p>{algorithm.education[language].what}</p>
          <EducationalContent algorithm={algorithm} language={language} />
        </article>)}
    </div>
  </section>;
}
