import type { Language } from "../../i18n/translations";
import { SEARCHING_EDUCATION } from "../../searching/education";
import { SEARCHING_ALGORITHMS, SEARCHING_DEFINITIONS } from "../../searching/evaluation";
import { FamilyEducation } from "./FamilyEducation";

const algorithms = SEARCHING_ALGORITHMS.map(slug => ({
  slug, name: SEARCHING_DEFINITIONS[slug].name, education: SEARCHING_EDUCATION[slug].education,
}));

export function SearchingEducation({ language }: { language: Language }) {
  return <FamilyEducation id="searching" title="Searching" algorithms={algorithms} language={language} />;
}
