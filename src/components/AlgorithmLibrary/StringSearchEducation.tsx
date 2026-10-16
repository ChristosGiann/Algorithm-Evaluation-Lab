import type { Language } from "../../i18n/translations";
import { STRING_SEARCH_EDUCATION } from "../../stringSearch/education";
import { STRING_SEARCH_NAMES } from "../../stringSearch/registry";
import type { StringSearchAlgorithm } from "../../stringSearch/evaluation";
import { FamilyEducation } from "./FamilyEducation";
const algorithms = (Object.keys(STRING_SEARCH_NAMES) as StringSearchAlgorithm[]).map(slug => ({
  slug, name: STRING_SEARCH_NAMES[slug], education: STRING_SEARCH_EDUCATION[slug].education,
}));
export function StringSearchEducation({ language }: { language: Language }) {
  return <FamilyEducation id="string-search" title="String Search" algorithms={algorithms} language={language} />;
}
