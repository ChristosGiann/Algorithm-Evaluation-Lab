import { StringSearchVisualization } from "./components/StringSearch/StringSearchVisualization";
import { SearchingComparison } from "./components/Searching/SearchingComparison";
import { useEffect, useState } from "react";

import "./App.css";
import { SortingVisualization } from "./components/SortingVisualization/SortingVisualization";
import { Comparison } from "./components/Comparison/Comparison";

import { AlgorithmLibrary } from "./components/AlgorithmLibrary/AlgorithmLibrary";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { BackendStatus } from "./components/BackendStatus/BackendStatus";
import { Experiments } from "./components/Experiments/Experiments";
import { Benchmark } from "./components/Benchmark/Benchmark";
import { CustomPython } from "./components/CustomPython/CustomPython";
import { SearchingVisualization } from "./components/Searching/SearchingVisualization";
import { Pathfinding } from "./components/Pathfinding/Pathfinding";

import type { Language } from "./i18n/translations";
import { translations } from "./i18n/translations";

const DEFAULT_LANGUAGE: Language = "el";

function App() {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const texts = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translations[language].app.title;
  }, [language]);

  return (
    <main>
      <AppHeader texts={texts.app} language={language} onLanguageChange={setLanguage} />

      <BackendStatus texts={texts.backendStatus} />
      <Benchmark language={language} />
      <Comparison language={language} />
      <Experiments language={language} />
      <CustomPython language={language} />
      <SortingVisualization language={language} />

      <Pathfinding language={language} />
      <SearchingVisualization language={language} />
      <SearchingComparison language={language} />
      <StringSearchVisualization language={language} />

      <AlgorithmLibrary
        texts={texts.algorithmLibrary}
        language={language}
      />
    </main>
  );
}

export default App;
