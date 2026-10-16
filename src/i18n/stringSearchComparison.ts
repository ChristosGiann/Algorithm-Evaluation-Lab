export const stringSearchComparisonTexts = {
  el: {
    title: "Σύγκριση string-search algorithms", note: "Ίδιο text/pattern για όλους. First-match, case-sensitive UTF-16 indexes, χωρίς trim ή normalization. Έως 10.000 text / 1.000 pattern code units. Κενό pattern: index 0.",
    select: "Επίλεξε 2–4 algorithms", text: "Κείμενο", pattern: "Pattern", run: "Εκτέλεση σύγκρισης", empty: "Εκτέλεσε μια σύγκριση για να εμφανιστούν αποτελέσματα.", invalid: "Μη έγκυρο text/pattern ή υπέρβαση ορίων.", selection: "Επίλεξε 2–4 διαφορετικούς algorithms.",
    results: "Αποτελέσματα String Search", algorithm: "Αλγόριθμος", status: "Αποτέλεσμα", index: "Πρώτο index", correctness: "Ορθότητα", prepTime: "Preprocessing (ms)", searchTime: "Search (ms)", prepCount: "Preprocessing comparisons", searchCount: "Search comparisons", found: "Βρέθηκε", absent: "Δεν βρέθηκε", correct: "Σωστό", incorrect: "Λανθασμένο", failed: "Σφάλμα", size: "Text / pattern code units",
    timing: "Χρόνοι μίας εκτέλεσης στον browser, χωριστά για preprocessing και search. Validation, oracle και animation εξαιρούνται. Δεν αποτελούν στατιστικό ranking.",
    counters: "Οι counters μετρούν ισότητες χαρακτήρων. Hash arithmetic, hash equality και map lookups δεν είναι character comparisons. Μηδέν comparisons δεν σημαίνει μηδενική εργασία.",
    errors: {preprocessing_error: "Αποτυχία preprocessing", runner_error: "Αποτυχία αναζήτησης", invalid_result: "Μη έγκυρο αποτέλεσμα", invalid_clock: "Μη έγκυρο χρονόμετρο"},
  },
  en: {
    title: "String-search algorithm comparison", note: "Same text/pattern for every algorithm. First-match, case-sensitive UTF-16 indexes, without trimming or normalization. Up to 10,000 text / 1,000 pattern code units. Empty pattern: index 0.",
    select: "Select 2–4 algorithms", text: "Text", pattern: "Pattern", run: "Run comparison", empty: "Run a comparison to see results.", invalid: "Invalid text/pattern or input limit exceeded.", selection: "Select 2–4 distinct algorithms.",
    results: "String Search results", algorithm: "Algorithm", status: "Result", index: "First index", correctness: "Correctness", prepTime: "Preprocessing (ms)", searchTime: "Search (ms)", prepCount: "Preprocessing comparisons", searchCount: "Search comparisons", found: "Found", absent: "Not found", correct: "Correct", incorrect: "Incorrect", failed: "Error", size: "Text / pattern code units",
    timing: "Single-run browser timings, separating preprocessing and search. Validation, oracle and animation are excluded. These are not a statistical ranking.",
    counters: "Counters measure character equality checks. Hash arithmetic, hash equality and map lookups are not character comparisons. Zero comparisons does not mean zero work.",
    errors: {preprocessing_error: "Preprocessing failed", runner_error: "Search failed", invalid_result: "Invalid result", invalid_clock: "Invalid clock"},
  },
};
