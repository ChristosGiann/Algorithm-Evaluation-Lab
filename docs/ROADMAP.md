# Roadmap

Τρέχον snapshot, 2026-10-15: ολοκληρωμένα sorting evaluation και weighted pathfinding UI/education/persistence. Το Searching #114–#122 περιλαμβάνει τέσσερις algorithms, visualization, comparison, education, persistence και comprehensive tests. Το String Search έχει foundation και pure Naive (#128). Επόμενα #129–#134: KMP, Rabin-Karp, Boyer-Moore, visualization, comparison και education. String-search persistence/coverage και public deployment ακολουθούν σε ξεχωριστά issues.

## Main development path

```text
Algorithm Library
        ↓
Dataset Generators
        ↓
Benchmark Runner
        ↓
Experiment API
        ↓
Results Dashboard
        ↓
MVP Integration
        ↓
Advanced Comparison
        ↓
Visualization
        ↓
Additional Algorithm Families
```

The evaluation pipeline is the priority. Infrastructure should be added only when it solves a real requirement.

## Phase 0 — Foundation

Status: **Completed**

- React/Vite frontend foundation
- Django backend foundation
- Django REST Framework
- backend health endpoint
- CORS configuration
- frontend API client
- base pathfinding grid
- i18n structure

## Phase 1 — Algorithm domain

Status: **Completed**

- `Problem`
- `Algorithm`
- `AlgorithmImplementation`
- sorting seed command
- Bubble Sort
- Selection Sort
- Insertion Sort
- Merge Sort
- Quick Sort
- complexity metadata
- migrations
- Django admin support

## Phase 2 — Algorithms API

Status: **Completed**

- `GET /api/algorithms/`
- serializers
- active built-in implementation filtering
- private `registry_key`
- backend automated tests

## Phase 3 — Issue #16: Algorithm Library

Status: **Merged through PR #27; Issue #16 closed**

Implemented:

- TypeScript API types
- `getAlgorithms()`
- responsive Algorithm Library
- algorithm cards
- complexity display
- implementation display
- loading state
- empty state
- error state
- retry
- Greek and English translations
- integration into `App.tsx`

Follow-up fixes for retry cleanup, lint scope, and backend health polling were
committed as `9e1582b`, integrated into `dev`, and promoted to `main` with
the combined snapshot through PR #33 on 2026-09-23. See [Progress](PROGRESS.md).

## Phase 4 — Issue #17: Dataset Generators

Status: **Merged through PR #28 and promoted to main through PR #33; Issue #17 closed**

Initial dataset types:

- Random
- Sorted
- Reversed
- Nearly Sorted

Issue #17 acceptance sizes:

- 10
- 100
- 1,000
- custom size from 1 through 100,000

Requirements:

- each generator accepts `size` and `seed`; identical configuration reproduces input,
- focused tests,
- safe copies so one algorithm cannot mutate another algorithm's input.

Few Unique Values and larger preset sizes were suggested in the imported plan.
They remain possible extensions, not part of Issue #17's current scope.

## Phase 5 — Issue #18: Benchmark Runner

Status: **Merged through PR #29 and promoted to main through PR #33; Issue #18 closed**

Initial measurements:

- execution time
- algorithm
- implementation
- dataset type
- input size

Later possibilities:

- comparisons
- swaps
- iterations
- memory usage

## Phase 6 — Issue #19: Experiment Model + API

Status: **Merged through PR #30 and promoted to main through PR #33; Issue #19 closed**

Experiment definitions store selected implementations and owned dataset
configurations. Create and retrieve APIs, draft default, five model statuses,
validation and atomic persistence are implemented. Execution, lifecycle transitions
and stored timing results are now added separately in #43. See [Experiments](EXPERIMENTS.md).

## Phase 7 — Issue #20: Results Dashboard

Status: **Merged through PR #31 and promoted to main through PR #33; Issue #20 closed**

Implemented: a session results table, median/min/max chart, correctness and
error/timeout states for the Bubble Sort benchmark. History is not persisted.
Experiment execution/results are added in #43; saved experiment UI and history are delivered in #45/#47. See [Results dashboard](RESULTS_DASHBOARD.md).

## Phase 8 — Issue #21: Personal Implementation Review

Status: **Merged through PR #32 and promoted to main through PR #33; Issue #21 closed**

The live issue #21 requests subjective ratings and notes per implementation.
The earlier mapping to MVP Integration Review was stale. Six optional 1–5
ratings, strengths, weaknesses, use cases and notes are persisted via GET/PUT
and edited through a Greek form in the Algorithm Library.
See [Implementation reviews](IMPLEMENTATION_REVIEWS.md) for the single-user scope.

## Issue #22: Custom Python implementation validation

Status: **Integrated into dev through PR #38**

Delivered scope:

- accept Python source code for a local custom implementation,
- validate syntax,
- require a `solve(values)` function,
- enforce a source-size limit,
- return structured validation errors,
- provide explicit local CLI execution with a 2-second subprocess timeout,
- keep arbitrary custom-code execution local-development-only until a real sandbox exists.

Η αρχική υλοποίηση #22 ήταν static-only HTTP. Τα #67/#68 προσθέτουν opt-in trusted local execution/comparison. Custom persistence παραμένει μελλοντικό.
See [Custom Python](CUSTOM_PYTHON.md).

## Future milestone — MVP Integration Review

Status: **Planned; not the scope of Issue #21**

End-to-end flow:

```text
Select algorithm(s)
    ↓
Generate dataset
    ↓
Run benchmark
    ↓
Store results
    ↓
Retrieve results
    ↓
Display comparison
```

Review:

- architecture
- API contracts
- error handling
- tests
- UX
- documentation
- data correctness

## Phase 9 — Visualization

Status: **Sorting implemented in #64; pathfinding animation remains future**

Sorting controls:

- Play
- Pause
- Step
- Reset
- Speed

Sorting visualization δείχνει comparisons, swaps/writes και active indices.

The existing pathfinding grid can later support graph algorithms.

## Phase 10 — Additional algorithm families

Possible order:

1. Searching
2. Graph traversal / shortest path
3. Dynamic programming
4. String matching
5. Trees

## Phase 11 — Advanced features

Possible future features:

- custom datasets
- experiment history (implemented #47/#62)
- experiment replay
- CSV/JSON export
- richer benchmark statistics (implemented #63)
- algorithm ranking views
- memory measurements
- custom implementations (trusted local execution implemented #67/#68; persistence/public sandbox future)
- AI-assisted result explanation

These are outside the first MVP.

## Issue #12 — Portfolio-ready README

Το README έχει ανανεωθεί στο παρόν feature snapshot με setup frontend/backend,
πραγματικό screenshot, τεχνική ροή, roadmap και σαφή MVP limitations. Το public
demo URL θα προστεθεί μετά από deploy. Το #11 (language selector) περιγράφεται στην επόμενη ενότητα.

## Lower-priority backlog

Previously discussed work also includes:

- README/documentation improvements
- persisted language preference και μεταφράσεις catalogue content, εφόσον χρειαστούν
- continued visualizer improvements

These should not interrupt the evaluation pipeline unless they become blockers.

## Issue #11 — Ελληνικά / English

Υλοποιημένο στο παρόν feature snapshot: κοινή επιλογή γλώσσας στο header,
μεταφράσεις UI σε όλες τις ενότητες και διατήρηση drafts/results. Δεν περιλαμβάνει
αυτόματη μετάφραση δεδομένων ή αποθήκευση προτίμησης. Βλ. [Language](LANGUAGE.md).

## Issue #41 — Πρώτο βήμα sorting MVP integration

Στο παρόν feature snapshot: δεύτερος trusted sorter (Insertion Sort), κοινός runner,
selector και ταυτότητα algorithm σε session results. Έγινε merge μέσω PR #42.
Το #43 προσθέτει experiment execution, persistence αποτελεσμάτων και retrieval.
Αυτόματη σύγκριση πολλών implementations παραμένει ξεχωριστό βήμα.

## Issue #43 — Experiment execution / persistence

Στο παρόν feature snapshot υλοποιείται backend run API, server-owned status και
persisted measurement snapshots. Έγινε merge μέσω PR #44. Το #41 ενσωματώθηκε στο dev
μέσω PR #42 και έκλεισε. Επόμενο βήμα: UI για δημιουργία/εκτέλεση/ανάκτηση experiments.

## Issue #45 — UI integration

Υλοποιείται η ροή create → run → persisted results → reopen by ID στο UI.
Το #43 έχει γίνει merge μέσω PR #44. Το #45 έγινε merge μέσω PR #46.
History/listing υλοποιείται στο #47. Editing και automatic ranking παραμένουν ξεχωριστά βήματα.

## Issue #47 — History/listing

Υλοποιείται το ιστορικό saved experiments με pagination και άνοιγμα από λίστα.
Έγινε merge στο dev μέσω PR #48. Search/filter, editing και richer comparison είναι ξεχωριστά βήματα.


## Issue #51 — Selection Sort

Υλοποιείται Selection Sort σε benchmark API, selector el/en και saved experiments.
Επιλέγει το ελάχιστο στοιχείο σε κάθε pass: O(n²) χρόνος, O(1) επιπλέον χώρος.
Τα όρια παραμένουν 1000 items, 10 runs και 4 experiment pairs. Το #51 ενσωματώθηκε μέσω PR #54. Τα #52/#53 ολοκληρώνουν Merge/Quick Sort.


## Issue #52 — Merge Sort

Προστίθεται bottom-up Merge Sort: O(n log n) χρόνος και O(n) βοηθητικός χώρος.
Benchmark API, selector el/en και persisted experiments χρησιμοποιούν την ίδια trusted implementation.
Το υπάρχον list μεταβάλλεται, χωρίς recursion ή αλλαγή των execution limits.


## Issue #53 — Quick Sort

Προστίθεται iterative three-way Quick Sort με middle pivot και επεξεργασία μικρότερου partition πρώτα.
O(n log n) average, O(n²) worst-case, O(log n) stack· όλα ίσα στοιχεία ολοκληρώνονται σε O(n).
Και οι πέντε catalogue sorters είναι executable σε benchmark/experiments.
Τα #51/#52 ενσωματώθηκαν με PR #54/#55. Διατηρείται όριο 4 pairs ανά experiment·
οι πέντε implementations δεν επιλέγονται όλες μαζί σε ένα run.


## Comparison backend (#58)

POST `/api/benchmarks/sorting/compare/`: algorithms (2–5 distinct trusted slugs), size (1–1000), dataset_type και seed. Μία deterministic generation, fresh copy ανά sorter/run, 10 runs. Response: configuration και results με algorithm/status/measurement ή ασφαλές runner_error χωρίς metrics. Αποτυχία ενός sorter δεν ακυρώνει τους υπόλοιπους. Χωρίς persistence· ίδια single-run contracts. Tests: κοινό input, distinct copies, dispatch, API validation και isolated failures.


## Comparison view (#59)

Dedicated comparison form επιλέγει 2–5 sorters και κοινό dataset. Table και median/min/max chart χρησιμοποιούν κοινή κλίμακα ms. Incorrect rows διατηρούν τη σήμανσή τους, failed rows δεν εμφανίζουν metrics. State ανεξάρτητο από language, request guard/abort και 30s timeout. Rendering tests καλύπτουν el/en, shared scale και zero timings. Το #58 ενσωματώθηκε μέσω PR #69.


## Theory context (#60)

Single/comparison result rows αντιστοιχίζονται με slug στο catalogue API και εμφανίζουν best/average/worst/space σε διακριτό details panel. Missing/failed metadata δεν κατασκευάζουν Big-O και δεν κρύβουν timings. Fetch με 15s timeout/abort, ανεξάρτητο από language. Tests για exact mapping και fallback.


## CI (#61)

GitHub Actions `.github/workflows/checks.yml` τρέχει σε PR προς dev/main και push στα δύο μόνιμα branches. Backend: Python 3.10, pinned requirements, tests/check/migration consistency. Frontend: Node 24, npm ci, tests/lint/build. Independent jobs, read-only contents permission, 10-minute timeouts, cancellation παλαιότερου run στο ίδιο ref. Τα env values είναι αποκλειστικά test defaults, χωρίς secrets. Δεν αλλάζουν branch protections/deployment.


## Persisted comparisons (#62)

Comparison response προσθέτει save_token μόνο για πλήρη measured batches. POST `/api/benchmarks/sorting/compare/save/` δέχεται name/token, επαληθεύει server signature (1 ώρα), και αποθηκεύει υπάρχουσες μετρήσεις σε Experiment/ExperimentResult χωρίς rerun. Δεν δέχεται client timings. Snapshot marker comparison επιτρέπει reopen με το κοινό chart από το υπάρχον history/ID. Catalogue identity αποτυπώνεται κατά το save· αν λείπει απορρίπτεται. Έως 5 ήδη εκτελεσμένα results, ενώ draft execution παραμένει max 4 pairs. Χωρίς migration. Token replay μπορεί να δημιουργήσει δεύτερο saved copy· σε timeout ελέγχουμε history πριν retry. Tests: signature/expiry/tamper, persistence/history/immutable snapshots και frontend reconstruction.


## Richer statistics (#63)

Mean και population standard deviation (`mean_ns`, `stddev_ns`) υπολογίζονται από τα ίδια 10 timings. Median/min/max παραμένουν. Στο comparison το πρώτο algorithm του request είναι σταθερό, ρητό `baseline_algorithm`: `relative_speed = baseline median / row median`, μόνο για σωστά αποτελέσματα με θετικούς χρόνους και finite ratio. Αποτυχία του baseline δεν επιλέγει άλλο· επιστρέφεται null. Baseline και ratio διατηρούνται μέσα στα measurement snapshots. Παλιά snapshots χωρίς νέα fields εμφανίζουν —. UI σε ms, ratios σε ×, χωρίς statistical significance/winner claims. Tests ελέγχουν ακριβείς υπολογισμούς, zero/incorrect/overflow, persistence και el/en rendering.


## Sorting visualization (#64)

Ανεξάρτητο TypeScript educational trace για Bubble/Insertion/Selection/Merge/Quick, με algorithm identities του catalogue, explicit input 1–32 integers 0–999 και immutable step snapshots. Play/Pause/Step/Speed/Reset χρησιμοποιούν καθαρό reducer· αλλαγή algorithm ξαναφορτώνει το αρχικό input. Το UI εξηγεί ότι writes μπορεί να εμφανίζουν προσωρινά duplicates λόγω buffer/key εκτός array. Δεν καλείται ούτε αλλάζει ο Python benchmark runner και δεν παράγονται performance metrics από animation. Tests καλύπτουν deterministic traces, duplicates/sorted/reversed/singleton, input validation, playback transitions και el/en controls.


## Educational library (#66)

Το catalogue API προσθέτει optional `education`: curated el/en what/intuition/how/strengths/weaknesses/uses/pitfalls, stable/in_place properties και deterministic walkthrough για τους 5 sorting algorithms. Η πηγή είναι το versioned backend module core/education.py· Big-O συνεχίζει να προέρχεται από τα υπάρχοντα model fields. Η Library επαναχρησιμοποιεί αυτά τα metadata, με ασφαλές fallback όταν optional περιεχόμενο λείπει. Τα walkthroughs δείχνουν σημαντικές καταστάσεις, όχι κάθε σύγκριση. Η Quick Sort σημείωση διακρίνει generic catalogue family από το three-way, smaller-range-first implementation. Δεν υπάρχει dynamic content generation ή inference από timings. Backend coverage ελέγχει πληρότητα και παραδείγματα, frontend tests el/en structure και missing fields.


## Trusted custom benchmark (#67)

POST `/api/benchmarks/sorting/custom/` με source, trusted:true, size, seed, dataset_type. Disabled by default: απαιτούνται DEBUG, `ENABLE_TRUSTED_CUSTOM_EXECUTION=true`, loopback REMOTE_ADDR και επιτρεπόμενο frontend Origin. Το UI ζητά acknowledgement για δικό σου trusted code. Για προσωρινή τοπική ενεργοποίηση PowerShell: `$env:ENABLE_TRUSTED_CUSTOM_EXECUTION='true'` και restart backend στο 127.0.0.1. Μην ενεργοποιείται σε public/proxied server. Δεν αλλάζει αυτόματα το .env.

Νέος worker, ξεχωριστός από το παλιό CLI smoke: Python -I -S, προσωρινό cwd, reduced env, stdout/stderr discarded, 2 s wall timeout, ένα custom process ανά server process, input≤1000/source≤32768 UTF-8 bytes/output≤16 KiB. Unix επιπλέον 256 MiB address-space/2 s CPU/file-size limits· Windows έχει wall-time/input/output/concurrency limits, όχι OS memory isolation. **Δεν είναι hostile-code sandbox**. Static validation προηγείται· execution subset δέχεται μόνο function definitions χωρίς imports/classes/decorators/defaults/annotations, περιορισμένα built-ins και list/dict methods (core/custom_python/benchmark.py). Δεν υποστηρίζονται packages/network/I/O.

solve(values) επιστρέφει list ή None για in-place. Δέκα fresh copies, μόνο solve timed, correctness μετά κάθε run, ίδιο timing_statistics helper με built-ins. Structured validation/runtime/timeout/busy/unavailable errors, ποτέ fallback. Source/results δεν αποθηκεύονται. Tests: πραγματικά subprocess success/incorrect/exception/timeout/fresh-copy, rejection πριν process, local opt-in gates και bilingual UI acknowledgement. Η παλαιότερη περιγραφή «μόνο CLI execution» αντικαθίσταται από αυτό το opt-in flow.


## Mixed custom/built-in comparison (#68)

Το υπάρχον POST sorting/compare/ δέχεται optional custom_source και trusted:true μαζί με 1–4 distinct built-ins (χωρίς custom παραμένει 2–5). Μία generation, ανεξάρτητες copies σε parent/worker, ίδιο configuration και metrics helper. Το πρώτο selected built-in είναι το ρητό baseline· custom row έχει source_type:custom και algorithm:custom-python. Failure/timeout/disabled/invalid custom δεν ακυρώνουν τις built-in μετρήσεις και δεν δημιουργούν metrics. Το UI προσθέτει προαιρετική built-in επιλογή στη custom φόρμα και επαναχρησιμοποιεί ComparisonResults/table/common scale/relative speed. Mixed results δεν παίρνουν save_token: custom persistence είναι εκτός scope. Process startup δεν χρονομετρείται· ο worker έχει ξεχωριστό process context, επομένως οι χρόνοι δεν αποδεικνύουν γενική ανωτερότητα. Backend tests καλύπτουν same dataset/fresh copies/πραγματικό worker/errors, frontend tests mixed identities/scales/failed rows.


## Pathfinding foundation (#65)

Κοινό GridInput/Search/PathfindingResult για bfs/dfs/dijkstra/astar, adapter από υπάρχον UI grid χωρίς DOM, frozen copies, cardinal unit-cost neighbours και same-grid evaluation utility. Found/no-path/invalid/runner error έχουν διακριτό contract. Timing μόνο του search call· path length σε ακμές, null όταν δεν υπάρχει path. Δεν προστίθενται ακόμη οι τέσσερις algorithms, animation ή persistence και δεν κλείνουν τα #1–#10. Αναλυτικό contract και όρια στο [Pathfinding](PATHFINDING.md). Tests καλύπτουν input validation, walls/markers, same-cell/no-path, invalid trace, timing boundary και copy isolation· το sorting regression suite παραμένει ενεργό.

## Ενεργή συνέχεια pathfinding

Μετά την ολοκλήρωση του sorting scope, σειρά εξαρτήσεων: #2 neighbours → #3 reconstruction → #1 BFS → #10 algorithm tests. Ακολουθούν animation/controls/statistics και DFS/comparison. Το #2 έχει ελεγχθεί με dedicated regression tests.

Το #3 παρέχει το reconstruction utility και τα tests του. Επόμενη εξάρτηση: BFS (#1).

Το #1 προσθέτει πραγματικό BFS ως pure function. Η σύνδεση με UI/animation παραμένει στο #4· ακολουθεί ενίσχυση correctness tests (#10).

Το #10 ολοκληρώνει το algorithm correctness suite. Επόμενο βήμα: BFS animation (#4) και προστασία controls (#5).

Το #5 ολοκληρώνει την προστασία pathfinding controls κατά το animation. Ακολουθούν clear path (#6), statistics (#7), DFS (#8) και comparison (#9).

Το #6 προσθέτει dedicated clear-path control. Επόμενο το statistics panel (#7).

Το #7 προσθέτει statistics panel. Επόμενα pathfinding βήματα: DFS (#8) και same-grid comparison (#9).

Το #8 ενεργοποιεί DFS με το ίδιο UI/result contract. Επόμενο το comparison (#9).

Το #9 ολοκληρώνει τη σύγκριση BFS/DFS στο ίδιο grid χωρίς animation. Το αρχικό pathfinding scope #1–#10 έχει καλυφθεί· Dijkstra/A* και persistence παραμένουν εκτός αυτού του scope.

Το #90 προσθέτει weighted Dijkstra στο καθαρό domain. Ακολουθούν #91 A* → #92 terrain/UI integration → #93 education → #94 persistence. Τα νέα costs είναι opt-in στο input, όχι αυτόματη αλλαγή του UI grid.

Το #91 ολοκληρώνει pure A* και scaled Manhattan heuristic. Επόμενο #92: weighted terrain, cost presentation και UI integration Dijkstra/A* με BFS/DFS. Ακολουθούν education (#93) και persistence (#94).

Το #92 ολοκληρώνει weighted terrain και UI integration BFS/DFS/Dijkstra/A*, μαζί με ξεχωριστό total path cost. Επόμενα #93 pathfinding education και #94 persistence.

Το #93 ολοκληρώνει curated el/en pathfinding education στη Library: theory, guarantees, weighted prerequisites και tested walkthroughs για τους τέσσερις algorithms. Επόμενο #94 pathfinding persistence.

Το #94 προσθέτει persistence για ολοκληρωμένα pathfinding runs/comparisons στο κοινό Experiment history, με input/result snapshots και reopen χωρίς rerun.

Το #95 εξάγει shared experiment storage, frontend save lifecycle και typed snapshot contracts με δύο πραγματικούς consumers. Το architecture guide τεκμηριώνει την προσθήκη μελλοντικών families χωρίς rewrite.

## Searching phase (#96)

Το foundation παρέχει contracts/validation/evaluation για Linear, Binary, Jump και Exponential Search. Ακολουθούν σε ξεχωριστά issues οι pure implementations με tests, education/visualization, UI comparison και persistence. Δεν έχουν υλοποιηθεί ακόμη οι τέσσερις algorithms. String search (#97) παραμένει ξεχωριστή family και το #98 αφορά το shared educational rendering. Βλ. [Searching](SEARCHING.md).

## String-search phase (#97)

Foundation με explicit first-match contract και σχεδιασμό επέκτασης all occurrences, preprocessing/search boundary και alignment trace. Επόμενα ξεχωριστά issues: Naive → KMP → Rabin-Karp → Boyer-Moore, έπειτα education/visualization/comparison UI/persistence. Το #98 γενικεύει το educational rendering για τις families. Βλ. [String search](STRING_SEARCH.md).

## Multi-family education (#98)

Το κοινό educational framework υποστηρίζει localized common και family-specific sections, με backward-compatible sorting/pathfinding content. Επόμενο scope είναι οι πραγματικές searching/string-search implementations και το curated περιεχόμενό τους μέσω ξεχωριστών issues. Βλ. [Education](EDUCATION.md).

## Linear Search (#114)

Πραγματική pure linear implementation στο src/searching/linear.ts για validated sorted/unsorted input. Εξετάζει αριστερά προς δεξιά και επιστρέφει το πρώτο match (συμβατό με any-match contract), αλλιώς null. Κάθε probe μετρά μία equality comparison. O(n) search χρόνος, O(1) algorithm state συν O(n) educational trace. Validation/copy/oracle παραμένουν εκτός timing στο evaluation layer. Tests καλύπτουν empty/singleton, first/middle/last, duplicates, absent, fractions, repeated runs, trace isolation και 10.000 στοιχεία μέσω common comparison. Δεν προστίθεται UI/API/persistence. Ακολουθεί Binary Search (#115).

## Binary Search (#115)

Pure iterative binary implementation: inclusive low/high, lower midpoint, μία equality comparison και (μόνο αν αποτύχει) μία less-than comparison ανά probe. Duplicates επιστρέφουν deterministic οποιοδήποτε matching midpoint. Το evaluateSearching επιβάλλει ascending input πριν το timing· direct binary καλείται μόνο με validated sorted data. Δεν γίνεται implicit sort. O(log n) search χρόνος/state O(1), συν O(log n) trace· το O(n) sortedness validation παραμένει εκτός search timing. Tests καλύπτουν boundaries/duplicates/absent/fractions, exact counters, unsorted rejection, common comparison με Linear και repeated runs σε 10.000 στοιχεία. Ακολουθεί Jump Search (#116), χωρίς αλλαγή UI/API.

## Jump Search (#116)

Pure jump implementation με deterministic step=max(1,floor(sqrt(n))). Κάνει μία less-than comparison ανά block-end probe και equality scans μόνο στο πρώτο block του οποίου το end δεν είναι μικρότερο από target. Repeated endpoint probes μετρούν ξανά· δεν γίνεται reuse παλιού probe. O(√n) search χρόνος, O(1) state συν O(√n) trace. Το shared evaluation επιβάλλει ascending input εκτός timing. Tests καλύπτουν empty/small, exact block boundaries, truncated last block, first/last, duplicates/fractions, absent, unsorted rejection και Linear/Binary/Jump comparison σε 10.000 στοιχεία. Δεν αλλάζει UI/API/persistence. Επόμενο #117 Exponential Search.

## Exponential Search (#117)

Pure exponential implementation: equality probe στο 0, doubling bounds 1/2/4/… με μία >= comparison ανά expansion probe και inclusive binary phase με equality/order comparisons. Repeated probes μετρούν ξανά. Input validation/sortedness προηγούνται του timing. Tests καλύπτουν empty/singleton/near/far/last/duplicates/absent, bounds, exact counters, isolation, 10.000 στοιχεία και σύγκριση και των τεσσάρων algorithms. Search O(log n), O(1) state συν O(log n) trace. UI/visualization ακολουθούν στο #118.

## Searching visualization (#118)

Οι τέσσερις πραγματικές implementations παρέχουν optional observer με probe, inclusive low/high και phase (scan/binary/jump/expand). Χωρίς observer διατηρούν τα ίδια metrics. Το searchingAnimation καταγράφει immutable frames έως 64 στοιχεία χωρίς clock/benchmark metrics. Linear δείχνει remaining suffix, Binary midpoint/range, Jump block boundaries και scan, Exponential expansion και binary phase. Το registry είναι η κοινή executable πηγή. UI: el/en, collection/target/algorithm, Play/Pause/Step/Reset/Speed, current/visited/range/match και σαφή precondition errors. Input/algorithm edits καθαρίζουν trace και timer, reset επαναφέρει frame 0. Pure reducer/trace tests και bilingual rendering tests ελέγχουν lifecycle, phase order, bounds και συμφωνία με πραγματικά probes. Το #119 προσθέτει ξεχωριστή measured comparison ροή.

## Searching comparison UI (#119)

Searching implementations (#114–#117), visualization (#118) και comparison UI/metrics (#119) είναι υλοποιημένα. Παραμένουν τα ξεχωριστά education και experiment persistence scopes· δεν έχουν προστεθεί αυτόματο sorting, string searching UI ή cross-family comparisons.

## Searching education (#120)

Η shared Algorithm Library εμφανίζει Linear/Binary/Jump/Exponential μέσω FamilyEducation και EducationalContent, ανεξάρτητα από τη φόρτωση του backend catalogue. Versioned el/en metadata: what/intuition/steps/complexity/strengths/limitations/uses/pitfalls/completeness και explicit preconditions. Τα κοινά walkthroughs στο [1,3,5,7,9,11,13,15]/11 ελέγχονται απέναντι στις πραγματικές implementations, μαζί με probes/counters και immutability. Διαχωρίζονται algorithm state, trace memory και validation cost· δεν εξάγεται performance ranking. Rendering tests ελέγχουν completeness και missing optional fields χωρίς invented content. Δεν προστίθεται runtime AI, API ή persistence.

## Searching persistence (#121)

Single-run/comparison save, shared history και reopen χωρίς rerun υλοποιήθηκαν. Ακολουθούν comprehensive searching coverage (#122) και Naive String Search (#128).

Το #122 ολοκληρώνει το comprehensive Searching test scope. Επόμενο: Naive String Search (#128).

## Naive String Search (#128)

Η πρώτη πραγματική string-search implementation λειτουργεί με το κοινό evaluation/comparison contract και deterministic tests. Παραμένουν τα επόμενα string-search algorithms και UI/visualization/persistence scopes.

## KMP (#129)

Pure KMP με frozen LPS table και deterministic preprocessing comparisons. Search κρατά text progress και κάνει fallback μέσω LPS, καταγράφοντας κάθε νέο valid candidate offset χωρίς invalid tail alignments. First-match/empty/UTF-16 semantics και χωριστά prepare/search timings μέσω shared contract. O(m) preprocessing, O(n) search, O(m) table συν O(n) trace. Tests: exact LPS/counters, overlapping/repeated prefixes, absent/boundaries/Unicode, repeated-run isolation, same-input comparison και 10.000/1.000 regression με operation-count bounds, όχι wall-time thresholds. Δεν προστίθεται UI/persistence.
