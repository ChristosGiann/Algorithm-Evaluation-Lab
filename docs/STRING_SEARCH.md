# String-search foundation (#97)

Το src/stringSearch/evaluation.ts ορίζει ξεχωριστή family για literal pattern matching μέσα σε text. Παρέχει executable contracts και evaluation/comparison helpers με injected trusted implementations. Η πρώτη πραγματική implementation, Naive, προστέθηκε στο #128. KMP/Rabin-Karp/Boyer-Moore, UI, API και persistence παραμένουν επόμενα scopes.

## Input και semantics

StringSearchInput: text, pattern και υποχρεωτικό mode:"first". Text έως 10.000 και pattern έως 1.000 UTF-16 code units. Δεκτά μόνο strings, χωρίς coercion, trimming ή normalization. Snapshot παγώνει το input object· τα strings είναι immutable.

Η σύγκριση είναι literal, case-sensitive, σε UTF-16 code units. Τα indexes είναι zero-based offsets όπως στο JavaScript String.indexOf, όχι code-point/grapheme indexes. Για παράδειγμα στο "😀a😀" το "a" βρίσκεται στο 2. Surrogate halves μπορούν να γίνουν match μεμονωμένα. Το decomposed "e + combining accent" δεν ισούται με το composed "é". Μελλοντικό visualization πρέπει να αποδίδει τις ίδιες μονάδες και να μη συγχέει offsets με οπτικούς χαρακτήρες.

- Empty pattern: πρώτο match στο 0, ακόμη και σε empty text.
- Empty text με nonempty pattern: not found.
- Pattern μεγαλύτερο από text: not found.
- Repeated/overlapping occurrences: επιστρέφεται μόνο η πρώτη. "aaaaa"/"aaa" → 0, "banana"/"ana" → 1.
- Not found: index:null και occurrenceIndexes:[], όχι -1.
- Found: occurrenceIndexes:[index], με ακριβώς ένα reported index.

Το foundation αποδέχεται μόνο mode:"first". Για all occurrences θα προστεθεί ξεχωριστό mode στο input/result union και trace με ταξινομημένα unique indexes, με overlaps (π.χ. "aaaaa"/"aaa" → [0,1,2]). Empty pattern σε εκείνο το mode θα σημαίνει κάθε όριο 0…text.length. Αυτή η επέκταση χρειάζεται νέο validation/oracle, fixtures και UI πριν ενεργοποιηθεί· σήμερα mode:"all" απορρίπτεται.

## Δύο φάσεις εκτέλεσης

PrepareStringSearch(pattern) επιστρέφει prepared object με preprocessing comparisons και search(text). Το evaluation καλεί prepare μία φορά ανά entry και μετρά χωριστά:
1. preprocessingTimeMs γύρω από το prepare call.
2. executionTimeMs γύρω από το search call.

Η προετοιμασία εξαρτάται μόνο από pattern. Pattern tables/hash setup ανήκουν εδώ· αρχικό text-window hash και rolling hashes ανήκουν στο search. Naive έχει ελάχιστο prepare που δημιουργεί το closure χωρίς tables· και αυτό μετριέται, δεν επιβάλλεται τεχνητό μηδενικό timing. Δεν γίνεται cache reuse από τον evaluator μεταξύ runs. Οι πραγματικές implementations οφείλουν να δημιουργούν ανεξάρτητη mutable κατάσταση ανά prepare.

Input validation, clock gaps, correctness oracle, result copying και rendering μένουν έξω από τα δύο timings. Trace/counter generation μέσα στους runners περιλαμβάνεται. Οι μετρήσεις είναι browser single-call samples με instrumentation, όχι αξιόπιστο αυτόματο ranking. Δεν υπάρχει timeout ή sandbox για injected synchronous functions.

## Result, counters και visualization boundary

Completed result: algorithm, mode, found, correct, index, occurrenceIndexes, preprocessingTimeMs, executionTimeMs, preprocessingComparisons, comparisons και alignments.

Το found εκφράζει την απάντηση της implementation· correct ελέγχει ανεξάρτητα ότι είναι το πρώτο πραγματικό match μέσω String.indexOf εκτός timing. Ένα αργότερο υπαρκτό match είναι completed/correct:false. Structural errors επιστρέφουν invalid_result. Exceptions διακρίνονται σε preprocessing_error/runner_error και μη finite ή αρνητική διάρκεια σε invalid_clock. Error rows δεν περιέχουν fabricated μηδενικές μετρήσεις.

Character comparisons σημαίνει αριθμό explicit συγκρίσεων code units: pattern–pattern στο preprocessing, text–pattern στο search. Loop/index checks, table lookups, hash arithmetic και hash equality δεν μετρούν ως character comparisons. Ένα Rabin-Karp candidate πρέπει τελικά να επαληθεύεται σε code units, με αυτές τις συγκρίσεις καταγεγραμμένες. Counters είναι safe non-negative integers, self-reported και structurally validated· η πραγματική ακρίβειά τους χρειάζεται tests ανά implementation.

Alignments είναι ordered candidate offsets στα οποία χωρά όλο το pattern, με επαναλήψεις επιτρεπτές και όριο 100.000 entries. Για empty pattern έγκυρα offsets είναι 0…text.length. Για μεγαλύτερο pattern δεν υπάρχουν valid candidates. Το returned index πρέπει να υπάρχει στα alignments. Το trace αποτελεί βάση για μελλοντικό pattern-shift visualization, όχι πλήρες character-by-character playback. Δεν επιβάλλεται comparisons ≥ alignments, καθώς ένα hash-based candidate μπορεί να απορριφθεί χωρίς character comparison.

## Same-input comparison και datasets

compareStringSearch δέχεται 1–4 μοναδικές planned identities με prepare functions. Κάθε entry κάνει νέα προετοιμασία στο ίδιο pattern και search στο ίδιο text. Ένα runner/preparation failure δεν εμποδίζει τα υπόλοιπα entries. Input/selection validation απορρίπτει invalid requests πριν ξεκινήσουν.

Deterministic test fixtures καλύπτουν empty inputs, absent pattern, longer pattern, beginning/end match, repeated characters, overlapping matches, case sensitivity, emoji και combining accents. Οι test runners επιστρέφουν contract fixtures· δεν αποτελούν υλοποιήσεις των algorithms.

## Roadmap και integration

| Planned identity | Επόμενη υλοποίηση |
| --- | --- |
| naive | Υλοποιήθηκε στο #128: literal left-to-right first-match baseline και exact counter tests |
| kmp | Pattern prefix table στο prepare, search και fallback tests |
| rabinKarp | Pattern hash setup, rolling text hash, collision verification tests |
| boyerMoore | Documented variant/shift tables, right-to-left checks και shift tests |

Η σειρά είναι implementations → curated education/visualization → same-input comparison UI → persistence. Κάθε νέο implementation scope αποκτά δικό του GitHub issue πριν ξεκινήσει. Το #98 αφορά κοινό educational rendering, χωρίς generated conclusions.

Persistence θα επεκτείνει το model/ExperimentByFamily με πραγματικό string-search schema και adapter προς store_experiment/useExperimentSave, καθώς και family label/detail renderer. Δεν προστίθενται τώρα μη λειτουργικές επιλογές στο κοινό history. Array searching παραμένει στο src/searching με διαφορετικά input, metrics και duplicate semantics.

## Verification

npm test εκτελεί tests/string-search.test.mjs μαζί με όλα τα υπάρχοντα regression suites. Ελέγχονται input limits, first-match correctness, malformed traces/counters, UTF-16 baseline, separated phase timing, detached results και failure isolation. Δεν υπάρχει νέα UI ροή για browser smoke.

## Naive String Search (#128)

Πραγματική pure implementation στο src/stringSearch/naive.ts ως PrepareStringSearch. Κρατά το pattern σε closure χωρίς tables/cache, με 0 preprocessing character comparisons (ο χρόνος prepare μετριέται κανονικά). Το search δοκιμάζει offsets αριστερά προς δεξιά και code units αριστερά προς δεξιά, σταματώντας στο πρώτο mismatch ή πρώτο πλήρες match. Empty pattern: index 0, alignments [0], comparisons 0· μεγαλύτερο pattern: null/[]/0. Case-sensitive UTF-16 semantics χωρίς normalization/regex και χωρίς χρήση native indexOf μέσα στην implementation.

Κάθε search δημιουργεί νέο trace/counters. Worst-case O((n-m+1)·m) για 1≤m≤n, O(1) algorithm state συν O(n-m+1) trace. Το κοινό evaluation/comparison κρατά validation και independent oracle έξω από τα χωριστά prepare/search timings. Tests: exact fixtures, empty/first/middle/last/overlap/repeated/case/Unicode, exhaustive 3.937 short text-pattern pairs, repeated-run isolation, common comparison και max 10.000/1.000 repeated-prefix input χωρίς timing thresholds. UI, visualization, persistence και KMP/Rabin-Karp/Boyer-Moore είναι επόμενα scopes.

## KMP (#129)

Pure KMP με frozen LPS table και deterministic preprocessing comparisons. Search κρατά text progress και κάνει fallback μέσω LPS, καταγράφοντας κάθε νέο valid candidate offset χωρίς invalid tail alignments. First-match/empty/UTF-16 semantics και χωριστά prepare/search timings μέσω shared contract. O(m) preprocessing, O(n) search, O(m) table συν O(n) trace. Tests: exact LPS/counters, overlapping/repeated prefixes, absent/boundaries/Unicode, repeated-run isolation, same-input comparison και 10.000/1.000 regression με operation-count bounds, όχι wall-time thresholds. Δεν προστίθεται UI/persistence.

## Rabin-Karp (#130)

Pure deterministic rolling hash: base 257, modulus 1.000.003, UTF-16 codeUnit+1. Όλα τα ενδιάμεσα integers παραμένουν κάτω από 2^53. Pattern hash/power στο prepare, initial window/rolling updates στο search. Hash equality δεν μετρά ως character comparison· κάθε hash candidate επαληθεύεται χαρακτήρα προς χαρακτήρα, άρα collisions δεν δίνουν false positives. Expected O(n+m), worst O(nm) με πολλούς candidates· O(1) state συν O(n) trace. Tests περιλαμβάνουν constructed collision [0,257]/[1,0], exact metrics, high code units, edge/repeated inputs, isolation και κοινό comparison σε max input. Δεν προστίθεται UI/persistence.

## Boyer-Moore (#131)

Pure bad-character-only variant: last-occurrence map στο prepare, right-to-left comparisons στο search, shift=max(1,j-last[text[offset+j]]) με absent=-1. Δεν χρησιμοποιούνται good-suffix ή Galil heuristics και δεν διεκδικούμε τη worst-case εγγύηση άλλων variants. O(m) preprocessing, O(nm) worst-case search, O(min(m,alphabet)) table συν alignment trace. Map writes/lookups δεν μετρούν ως character comparisons· preprocessingComparisons=0, αλλά ο χρόνος prepare μετριέται κανονικά. Empty/first-match/UTF-16 semantics κοινά. Tests: exact shifts/counters, repeats, boundaries/no-match, Unicode, isolation και comparison όλων των implementations σε long deterministic input. Χωρίς UI/persistence.

## String-search visualization (#132)

Optional search observer στις πραγματικές Naive/KMP/Rabin-Karp/Boyer-Moore implementations: compare/match/mismatch, KMP fallback/retained prefix, hash windows με πραγματικά hash values και BM right-to-left/shift. Χωρίς observer διατηρούνται results/counters. Immutable educational trace έως 64 text / 16 pattern UTF-16 units, χωρίς evaluation clocks. Κοινό registry identities, pure playback reducer, Play/Pause/Step/Reset/Speed, stale-state clear σε edits/new run. El/en aligned text/pattern rows σε κοινή οριζόντια κλίμακα με explicit UTF-16 indexes, U+ labels για whitespace/control/surrogate units, keyboard-scroll region και found/not-found completion. Tests: observer equivalence/order, phase details, reset lifecycle, limits και bilingual rendering. Χωρίς persistence ή animation-derived benchmark metrics.


## String-search comparison (#133)

El/en comparison για 2–4 algorithms στο ίδιο literal text/pattern. Διακριτά preprocessing/search timings και character counters, first-match index (0 διατηρείται, null εμφανίζεται ως —), correctness και isolated error rows χωρίς fabricated metrics. Edit input/selection καθαρίζει stale results. Χωρίς ranking ή persistence (ακολουθεί στο #135). Tests καλύπτουν empty/absent, selection validation και error/zero rendering.


## String Search education — #134 (2026-10-16)

Ολοκληρώθηκε το el/en περιεχόμενο Naive, KMP, Rabin-Karp και Boyer-Moore (bad-character) στο κοινό FamilyEducation. Περιλαμβάνει preprocessing, βήματα, complexity, περιορισμούς, χρήσεις και UTF-16/first-match semantics. Τα τέσσερα walkthroughs ελέγχονται απέναντι στο registry μαζί με τους preprocessing counters. Το #132 παρέχει visualization και το #133 comparison UI. Επόμενα: persistence #135 και cross-algorithm coverage #136.
