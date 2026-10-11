import type { Language } from "../../i18n/translations";
import { PATHFINDING_EDUCATION } from "../../pathfinding/education";
import { FamilyEducation } from "./FamilyEducation";

const algorithms = Object.entries(PATHFINDING_EDUCATION).map(([slug, algorithm]) => ({ slug, ...algorithm }));

export function PathfindingEducation({ language }: { language: Language }) {
  return <FamilyEducation id="pathfinding" title="Pathfinding" algorithms={algorithms} language={language} />;
}
