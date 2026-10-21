import { StringSearchComparison } from "./components/StringSearch/StringSearchComparison";
import { StringSearchVisualization } from "./components/StringSearch/StringSearchVisualization";
import { SearchingComparison } from "./components/Searching/SearchingComparison";
import { useEffect, useState } from "react";

import "./App.css";
import { SortingVisualization } from "./components/SortingVisualization/SortingVisualization";
import { Comparison } from "./components/Comparison/Comparison";

import { AlgorithmLibrary } from "./components/AlgorithmLibrary/AlgorithmLibrary";
import { AppShell, Overview } from "./components/AppShell/AppShell";
import { SortingWorkspace } from "./components/AppShell/SortingWorkspace";

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
    <AppShell language={language} onLanguageChange={setLanguage}>{ {
      overview: <Overview language={language} />,
      sorting: <SortingWorkspace language={language} panels={{
        benchmark: <Benchmark language={language} />,
        comparison: <Comparison language={language} />,
        visualization: <SortingVisualization language={language} />,
        custom: <CustomPython language={language} />,
      }} />,
      pathfinding: <Pathfinding language={language} />,
      searching: <><SearchingVisualization language={language} /><SearchingComparison language={language} /></>,
      strings: <><StringSearchVisualization language={language} /><StringSearchComparison language={language} /></>,
      experiments: <Experiments language={language} />,
      library: <AlgorithmLibrary texts={texts.algorithmLibrary} language={language} />,
    } }</AppShell>
  );
}

export default App;
