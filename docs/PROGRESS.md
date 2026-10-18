# Project Progress

Last verified: **2026-10-17**

## Current phase

Ολοκληρωμένα: sorting evaluation, weighted BFS/DFS/Dijkstra/A* με education και persistence, Searching Linear/Binary/Jump/Exponential με visualization/comparison/education/persistence και comprehensive tests (#114–#122). String Search: Naive/KMP/Rabin-Karp/Boyer-Moore, visualization, comparison, education, persistence και comprehensive coverage (#128–#136). Τα παρακάτω επιμέρους στάδια καταγράφουν την ιστορική εξέλιξη.

Το παρόν snapshot περιλαμβάνει το ολοκληρωμένο sorting evaluation scope #58–#64/#66–#68:
comparison, αποθήκευση/ιστορικό, statistics/baseline, Big-O context, educational
Library, visualization, trusted local custom execution και CI. Το #65 προσθέτει
το pathfinding input/result/evaluation foundation. Τα #2/#3/#1 παρέχουν neighbours,
reconstruction και pure BFS. Το #4 προσθέτει την UI σύνδεση και το animation του BFS. Τα #5/#6/#7 καλύπτουν
control locking, clear path και panel στατιστικών μετά το animation. Το #8 προσθέτει
DFS στον κοινό selector και στο ίδιο result/playback flow. Το #9 προσθέτει πίνακα σύγκρισης BFS/DFS στο ίδιο grid χωρίς animation. Τα #90/#91 προσθέτουν pure Dijkstra/A* και optional validated costs στο domain, και το #92 συνδέει τους τέσσερις algorithms με weighted terrain στο UI.
Η προώθηση από dev σε main γίνεται μόνο με ρητή εντολή· τα δύο branches παραμένουν μόνιμα.

Οι επόμενες ενότητες διατηρούν το ιστορικό ανά issue· οι παλιότερες test counts
και ενδιάμεσες καταστάσεις αφορούν την ημερομηνία τους.

## Git state

- Issue #16 is closed; PR #27 merged the Algorithm Library into `main`.
- Issues #17–#21 were merged into `dev` through PRs #28–#32.
- PR #33 promoted that integrated `dev` snapshot to `main` on 2026-09-23.
- `main` and `dev` are permanent. Never delete `dev`, locally or remotely,
  including after a dev-to-main PR. Delete only merged temporary issue branches.
- New issue branches should continue to start from `dev`.
- Promote `dev` to `main` only on explicit user request.

## Completed functionality

- React/TypeScript/Vite frontend and Django/DRF backend.
- Health endpoint and frontend API client.
- Pathfinding grid foundation, wall toggling, clear/reset controls, translations.
- `Problem`, `Algorithm`, and `AlgorithmImplementation` domain models.
- Idempotent seed command for Bubble, Selection, Insertion, Merge, and Quick Sort.
- Complexity metadata and read-only `GET /api/algorithms/` API.
- Filtering of active built-in implementations; private registry keys.
- Algorithm Library cards, loading/error/empty states and retry button.

Seeded implementation records are metadata. Bubble Sort (#18) and Insertion Sort (#41)
are executable through a fixed code allowlist. Selection Sort (#51) is also executable; Merge Sort (#52) is executable; Quick Sort (#53) completes all five executable sorters. The experiment resolver checks trusted catalogue identity.

## Follow-up fixes

- ESLint excludes `backend/.venv` dependencies.
- Algorithm Library retries set loading state in the event handler.
- Effect cleanup ignores outdated algorithm responses.
- Backend health is checked on mount and five seconds after each completed check.
- Health requests time out after five seconds; cleanup aborts requests and timers.
- Health recovery updates the status automatically; library recovery uses retry.

## Verification

Integration verification on 2026-09-23: 44 backend tests and 4 frontend rendering
tests passed, along with lint, build, Django checks and migration consistency.
Core migration 0003 and reviews migration 0001 are applied locally.
Issue #22 adds static custom Python validation and an explicit developer-only local runner; see the verification section below.

Browser scenarios verified against the real local backend:

- Available backend: all five algorithm cards and complexity metadata appear.
- Stopped backend: error message and retry button appear.
- Retry while stopped: loading returns to an actionable error state.
- Backend restored: retry loads all five cards without page refresh.
- Health polling: online to offline to online updates without refresh.

These were browser checks, not a newly added automated frontend test suite.
Timeout and cleanup behavior have not been separately exercised with a delayed
server response or an automated unmount test. See [Testing](TESTING.md).

## Next

1. Το ζητημένο sorting scope ολοκληρώθηκε. Το pathfinding foundation #65 προετοιμάζει την επόμενη φάση· τα #1–#10 παραμένουν ανοικτά και απαιτούν ξεχωριστή υλοποίηση. Νέα κενά καταγράφονται σε issue πριν από εργασία.
2. Keep `dev` as the permanent integration branch for subsequent issue branches.
3. Keep documentation synchronized in the same PR whenever feature status, API contracts, architecture, or roadmap change.

## Issue #12 — Portfolio README, 2026-09-25

Το παρόν feature snapshot ανανεώνει το README στα Ελληνικά με αγγλικούς technical
terms: σημερινά features, διάκριση benchmarking/visualization, vertical slice,
setup, πραγματικό screenshot, roadmap και MVP limitations. Δεν αλλάζει application
code. Το #22 ενσωματώθηκε μέσω PR #38 και η τεκμηρίωση συμφιλιώθηκε στο PR #39.
Η προτίμηση για ελληνικά PR descriptions/comments καταγράφεται στο DEVELOPMENT.

## Issue #19 verification

36 backend tests pass (25 existing + 11 new). Migration 0003 applied locally;
Django checks and migration dry-run passed. Actual HTTP POST returned 201 and
GET returned 200 with matching stored implementations and datasets. A local draft
named `Issue 19 API verification` (ID 1) remains available for inspection.
See [Experiments](EXPERIMENTS.md). No new experiment UI or execution is included.

## Scope alignment for Issue #17

The live issue specifies Random, Sorted, Reversed, and Nearly Sorted datasets;
`size` and `seed`; reproducibility tests; sizes 10, 100, 1000 plus bounded custom
sizes; and independent input copies for benchmark runs.

Few Unique Values appears in the imported plan but is a proposed extension.
The local implementation supports sizes 1 through 100,000 with the semantics
in [Datasets](DATASETS.md). The future runner must use `copy_for_run()`. No new dataset endpoint contract has been finalized.


## Issue #21 — 2026-09-22

Merged into `dev` through PR #32, then promoted to `main` through PR #33; Issue #21 closed.
Adds review persistence, strict GET/PUT API, Greek editable form and eight new
backend tests (44 total with experiments integrated). Lint/build and migration checks pass.
Browser verification covered save, refresh, update, offline load/save errors,
retry, and separate review data per implementation. See
[Implementation reviews](IMPLEMENTATION_REVIEWS.md).

PR #30 (#19), PR #31 (#20) and PR #32 (#21) were merged into `dev` and are now present on `main` through PR #33.
The earlier association of #21 with MVP Integration Review was corrected to the
live GitHub issue. All three completed temporary branches have been deleted.

## Issue #20 dashboard

Merged into `dev` through PR #31, then promoted to `main` through PR #33; Issue #20 closed.
See [Results dashboard](RESULTS_DASHBOARD.md) for scope, validation and limitations.
Both experiment and dashboard testing sections are retained in the integrated documentation.

## Issue #22 — 2026-09-25

Integrated through PR #38: Greek source editor, static-only validation
API, 32,768-byte limit, solve(values) contract, structured errors and explicit
local CLI execution with a 2-second subprocess timeout. No persistence, public
execution or custom benchmarks. All 60 backend tests and 4 frontend tests pass;
lint/build, Django checks and migration dry-run pass. No migrations required.
See [Custom Python](CUSTOM_PYTHON.md) for scope and verification limits.

## Issue #11 — Επιλογή γλώσσας

Το header προσφέρει Ελληνικά / English και ενημερώνει όλες τις ενότητες,
reviews, grid accessibility labels και custom validation errors. Default el,
χωρίς persistence της επιλογής. Τα drafts/results παραμένουν κατά την αλλαγή.
Προστέθηκαν πέντε frontend regression tests (εννέα συνολικά).
Βλ. [Language](LANGUAGE.md) για το contract και τα όρια.

## Issue #41 — Sorting selection

Στο παρόν feature snapshot προστέθηκε Insertion Sort, κοινός trusted runner και
POST `/api/benchmarks/sorting/`. Ο selector και κάθε αποτέλεσμα κρατούν την ταυτότητα
algorithm σε el/en. Το παλιό Bubble endpoint παραμένει συμβατό. Δεν αλλάζουν models.
Τα #11/#12/#22 έχουν ενσωματωθεί στο dev μέσω PR #40/#39/#38 και έκλεισαν.
Το #41 ενσωματώθηκε στο dev μέσω PR #42. Το feature περιλαμβάνεται στο release snapshot.

## Issue #43 — Εκτέλεση και αποθήκευση experiments

Backend-only feature: POST run, runtime validation, έως 4 pairs, atomic persistence,
GET persisted results και snapshot identity. Προστέθηκε migration 0004.
Το #41 έγινε merge στο dev μέσω PR #42 (20b0e96) και έκλεισε.
Το #43 ενσωματώθηκε στο dev μέσω PR #44· το standalone benchmark UI παραμένει session-only.

## Issue #45 — Experiment UI

Στο παρόν feature snapshot: create draft, run, open by ID, refresh, snapshot result
table και el/en feedback. Το #43 ενσωματώθηκε στο dev μέσω PR #44 (ac23024) και έκλεισε.
Το #45 έγινε merge μέσω PR #46. Το #47 προσθέτει history/listing· richer comparison ακολουθεί.

## Issue #47 — Experiment history

Στο παρόν feature snapshot: GET collection με bounded summaries/cursor, history UI,
previous/next, retry/refresh και άνοιγμα χωρίς ID πληκτρολόγηση. Ενσωματώθηκε στο dev μέσω PR #48.
Το #45 έχει ενσωματωθεί στο dev μέσω PR #46 (e350267) και έκλεισε.


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


### Integrated verification #51–#53 (2026-09-29)

91 backend και 17 frontend tests, lint/build, Django checks και migration dry-run επιτυχή.
Browser: κάθε νέος sorter έτρεξε benchmark, δημιουργήθηκε το local experiment #12
«Smoke #51–53 — Sorting catalogue» με Selection/Merge/Quick, εκτελέστηκε με τρία σωστά results,
έγινε refresh από server με ίδιες μετρήσεις και αλλαγή el/en. Δεν καταγράφηκαν console errors.
Το δείγμα παραμένει τοπικά για επιθεώρηση. Δεν προστέθηκε migration.


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

## Issue #2 — Pathfinding neighbours

Το υπάρχον neighbours του #65 καλύπτει τα cardinal neighbours χωρίς walls/out-of-grid ή UI logic. Προστέθηκε ξεχωριστό regression suite για edges/corners, narrow grids, invalid origins και copy isolation. Δεν προστέθηκε duplicate utility.

## Issue #3 — Path reconstruction

Υλοποιήθηκε καθαρό iterative reconstructPath με previous node references, start→end IDs, no-path/cycle handling και tests. Δεν προστίθεται ακόμη algorithm ή UI execution.

## Issue #1 — BFS

Προστέθηκε καθαρός BFS με deterministic traversal, shortest path σε unit-cost grid, walls/no-path/same-cell handling και συμβατότητα με evaluation metrics. Τα tests ελέγχουν processing order, route, isolation και reversed endpoints. Το UI παραμένει ανενεργό μέχρι το animation issue #4.

## Issue #10 — Pathfinding tests

Το dedicated suite καλύπτει neighbours, BFS paths/walls/no-path και ανεξάρτητη επαλήθευση σε 11.520 μικρά grid cases, συν το μέγιστο grid 10.000 cells. Εκτελείται με npm test και το υπάρχον CI. Η συνέχεια είναι η UI οπτικοποίηση (#4).

## Issue #4 — BFS animation

Ενεργό BFS visualization με ανεξάρτητο timer playback, visited πριν από path, speed selector και el/en feedback. Input markers/walls διατηρούνται. 43 frontend tests και lint/build επιτυχή. Χειροκίνητος έλεγχος στο production build μέσω localhost preview· ο Vite dev server δεν απαντούσε στο συγκεκριμένο session.

## Issue #5 — Animation controls

Τα pathfinding cells/buttons/selects κλειδώνουν κατά το running state και επανέρχονται όταν τελειώσει το playback. Handler guards αποτρέπουν grid edits και νέο run. UI state παραμένει ξεχωριστό από BFS logic, με aria-busy στην ενότητα. Οι υπόλοιπες ενότητες δεν κλειδώνουν.

## Issue #6 — Clear path

Προστέθηκαν clearPath utility και el/en κουμπί, με διατήρηση walls/endpoints και μηδενισμό προηγούμενου playback. Tests καλύπτουν immutable input, idempotence και disabled toolbar.

## Issue #7 — Pathfinding statistics

Panel μετά το τέλος του animation με BFS identity, found/no-path, visited count, μήκος σε βήματα και χρόνο μόνο του search. Δίγλωσσα labels και locale numbers, διακριτό null/zero, χωρίς παλιά metrics σε νέο run ή clear. Tests καλύπτουν rendering και lifecycle visibility.

## Issue #8 — DFS

Προστέθηκε iterative DFS και πραγματικό BFS/DFS registry, controlled selector και ενημέρωση UI state χωρίς ανάμειξη αποτελεσμάτων. DFS δεν υπόσχεται shortest path. Tests καλύπτουν depth-first order, longer-path example, walls/no-path/same-cell/reversed endpoints, repeated-run isolation, 10.000-node route και exhaustive reachability σε 11.520 layouts/endpoints.

## Pathfinding comparison (#9)

Ενεργό Compare για τους διαθέσιμους BFS/DFS, κοινό immutable input, search-only timing, el/en table και ανεξάρτητα error rows. Καθαρισμός παλιών αποτελεσμάτων σε αλλαγές grid/algorithm ή νέο run. Tests καλύπτουν πραγματικές implementations, no-path/zero-length/zero-time και failure rendering.

## Dijkstra foundation (#90)

Pure deterministic min-heap Dijkstra σε non-negative costs, κοινό result/evaluation/playback contract και immutable weighted snapshots. 57 frontend tests, με weighted detour, zero/fractional costs, independent all-pairs oracle σε 80 deterministic grids, no-path/same-cell, 10.000 cells, isolation και invalid costs. BFS/DFS και UI registry παραμένουν συμβατά. Επόμενα #91 A* και #92 terrain/UI integration.

## A* foundation (#91)

Pure A* με admissible/consistent scaled Manhattan, shared min-heap με Dijkstra, deterministic ordering και το ίδιο result/timing/playback contract. 60 frontend tests: independent weighted oracle, heuristic bounds/consistency, fractions/zero costs, walls/no-path/start=end, isolation και 10.000-cell path. Επόμενο #92 weighted terrain και UI integration και των τεσσάρων algorithms.

## Weighted terrain (#92)

Terrain plain/mud/water (1/3/5), ανεξάρτητο από wall/animation state, ασφαλές input mapping, four-algorithm UI/compare και pathCost metric. Σαφή clear/reset semantics και el/en κόστος/labels. 63 frontend tests, συμπεριλαμβανομένων weighted detours, input validation, preservation κατά το playback και comparison metrics. Επόμενο #93 educational content.

## Pathfinding education (#93)

Bilingual Library cards για BFS/DFS/Dijkstra/A* με intuition, βήματα, complexity, completeness, optimality, weighted suitability και deterministic walkthroughs. Domain metadata δεμένα με το registry, reusable renderer και optional fallback. 66 frontend tests, lint και production build περνούν. Browser smoke παραμένει μη επαληθευμένο: το browser automation αποτυγχάνει κατά την εκκίνηση του kernel. Επόμενο #94 persistence.

## Pathfinding persistence (#94)

Κοινό Experiment/Result subsystem με family και versioned input snapshot, atomic browser-result save endpoint, readonly reopen και family labels στο history. 114 backend / 68 frontend tests, lint/build/check/migration checks επιτυχή. Migration 0005 εφαρμόστηκε τοπικά. Browser smoke 2026-10-10: weighted four-algorithm comparison αποθηκεύτηκε ως #14, refresh/history reopen κράτησε ίδιες μετρήσεις και costs, el/en και disabled rerun επαληθεύτηκαν.

## Shared evaluation infrastructure (#95)

Κοινό atomic store_experiment για sorting/pathfinding snapshots, κοινό save controller/hook και type-safe StoredResult/ExperimentHeader/ExperimentByFamily. Οι validators, trust boundaries, runners και metrics παραμένουν family-specific. Architecture guide περιγράφει τα extension points και πώς επεκτείνεται κοινό history/save χωρίς αντιγραφή lifecycle. Δεν απαιτείται migration.

Validation #95: 117 backend / 72 frontend tests, lint/build, Django check και migration drift check επιτυχή. Browser smoke 2026-10-10: sorting comparison αποθηκεύτηκε ως #15 και pathfinding ως #16 μέσω των shared save/storage flows. Μετά από refresh, και τα δύο άνοιξαν από το κοινό history με persisted results και disabled rerun. Δεν απαιτείται migration.

## Searching foundation (#96)

Υλοποιήθηκαν input/result contracts, numeric validation, immutable snapshots, algorithm-specific sorted preconditions, search-only timing, independent correctness και same-input comparison με isolated failures. Found/index/probes/comparisons είναι διακριτά metrics. Οι τέσσερις algorithm identities είναι planned· δεν προστίθεται ακόμη executable registry ή UI. Βλ. [Searching](SEARCHING.md).

Validation #96: 78 frontend και 117 backend tests επιτυχή, lint/build, Django check και migration drift check καθαρά. Δεν αλλάζει UI/API/schema και δεν απαιτείται migration.

## String-search foundation (#97)

Προστέθηκαν text/pattern contracts, first-match/empty/UTF-16 semantics, χωριστά preprocessing/search metrics, independent correctness και same-input comparison. Deterministic fixtures καλύπτουν overlapping/repeated patterns, edge cases και failure isolation. Naive/KMP/Rabin-Karp/Boyer-Moore είναι planned identities, χωρίς πραγματικές implementations ή UI ακόμη. Βλ. [String search](STRING_SEARCH.md).

Validation #97: 85 frontend και 117 backend tests επιτυχή, lint/build, Django check και migration drift check καθαρά. Δεν απαιτείται migration.

## Shared educational framework (#98)

Κοινά education types, legacy adapter και section renderer για sorting/pathfinding, με localized extension sections και generic family cards. Searching/string-search fixtures επαληθεύουν την επέκταση χωρίς νέο rendering branch· το πλήρες curated περιεχόμενό τους παραμένει επόμενο scope. 87 frontend tests και lint/build επιτυχή. Browser smoke: BFS/Bubble Sort, el/en, walkthroughs και console καθαρά.

Backend validation #98: 117 tests, Django check και migration drift check επιτυχή. Δεν απαιτείται migration.

## Linear Search (#114)

Πραγματική pure linear implementation στο src/searching/linear.ts για validated sorted/unsorted input. Εξετάζει αριστερά προς δεξιά και επιστρέφει το πρώτο match (συμβατό με any-match contract), αλλιώς null. Κάθε probe μετρά μία equality comparison. O(n) search χρόνος, O(1) algorithm state συν O(n) educational trace. Validation/copy/oracle παραμένουν εκτός timing στο evaluation layer. Tests καλύπτουν empty/singleton, first/middle/last, duplicates, absent, fractions, repeated runs, trace isolation και 10.000 στοιχεία μέσω common comparison. Δεν προστίθεται UI/API/persistence. Ακολουθεί Binary Search (#115).

## Binary Search (#115)

Pure iterative binary implementation: inclusive low/high, lower midpoint, μία equality comparison και (μόνο αν αποτύχει) μία less-than comparison ανά probe. Duplicates επιστρέφουν deterministic οποιοδήποτε matching midpoint. Το evaluateSearching επιβάλλει ascending input πριν το timing· direct binary καλείται μόνο με validated sorted data. Δεν γίνεται implicit sort. O(log n) search χρόνος/state O(1), συν O(log n) trace· το O(n) sortedness validation παραμένει εκτός search timing. Tests καλύπτουν boundaries/duplicates/absent/fractions, exact counters, unsorted rejection, common comparison με Linear και repeated runs σε 10.000 στοιχεία. Ακολουθεί Jump Search (#116), χωρίς αλλαγή UI/API.

## Jump Search (#116)

Pure jump implementation με deterministic step=max(1,floor(sqrt(n))). Κάνει μία less-than comparison ανά block-end probe και equality scans μόνο στο πρώτο block του οποίου το end δεν είναι μικρότερο από target. Repeated endpoint probes μετρούν ξανά· δεν γίνεται reuse παλιού probe. O(√n) search χρόνος, O(1) state συν O(√n) trace. Το shared evaluation επιβάλλει ascending input εκτός timing. Tests καλύπτουν empty/small, exact block boundaries, truncated last block, first/last, duplicates/fractions, absent, unsorted rejection και Linear/Binary/Jump comparison σε 10.000 στοιχεία. Δεν αλλάζει UI/API/persistence. Επόμενο #117 Exponential Search.

Validation #114–#116: 95 frontend tests στο τελικό snapshot, lint/build και diff checks επιτυχή. Backend αμετάβλητο: 117 tests/check/migration consistency ελέγχθηκαν στην αρχή του κύκλου και επαναλαμβάνονται στο CI κάθε PR. Δεν υπάρχει νέα UI ροή για browser smoke.

## Exponential Search (#117)

Pure exponential implementation: equality probe στο 0, doubling bounds 1/2/4/… με μία >= comparison ανά expansion probe και inclusive binary phase με equality/order comparisons. Repeated probes μετρούν ξανά. Input validation/sortedness προηγούνται του timing. Tests καλύπτουν empty/singleton/near/far/last/duplicates/absent, bounds, exact counters, isolation, 10.000 στοιχεία και σύγκριση και των τεσσάρων algorithms. Search O(log n), O(1) state συν O(log n) trace. UI/visualization ακολουθούν στο #118.

## Searching visualization (#118)

Οι τέσσερις πραγματικές implementations παρέχουν optional observer με probe, inclusive low/high και phase (scan/binary/jump/expand). Χωρίς observer διατηρούν τα ίδια metrics. Το searchingAnimation καταγράφει immutable frames έως 64 στοιχεία χωρίς clock/benchmark metrics. Linear δείχνει remaining suffix, Binary midpoint/range, Jump block boundaries και scan, Exponential expansion και binary phase. Το registry είναι η κοινή executable πηγή. UI: el/en, collection/target/algorithm, Play/Pause/Step/Reset/Speed, current/visited/range/match και σαφή precondition errors. Input/algorithm edits καθαρίζουν trace και timer, reset επαναφέρει frame 0. Pure reducer/trace tests και bilingual rendering tests ελέγχουν lifecycle, phase order, bounds και συμφωνία με πραγματικά probes. Το #119 προσθέτει ξεχωριστή measured comparison ροή.

Validation #118: 102 frontend tests, lint/build και diff check PASS. Browser smoke (13/10/2026): Binary step/range, Play/Pause/Reset/Speed, Exponential expansion και ολοκλήρωση στο index 5, unsorted rejection, input edit clears stale trace, el/en. Κανένα browser console error.

## Searching comparison UI (#119)

Ολοκληρώθηκε η searching comparison ροή για 2–4 algorithms στο ίδιο input/target, με real metrics και ανεξάρτητα precondition/error rows. Inputs και επιλογές καθαρίζουν stale results. El/en accessible table, όριο 10.000, χωρίς implicit sorting ή αποθήκευση. Τα #117–#119 καλύπτουν πλέον Exponential, visualization και comparison.

Validation #119 (13/10/2026): 109 frontend tests PASS, lint/build και diff check PASS. Browser: 4 sorted successes, unsorted Linear + 3 precondition errors, not-found/empty, invalid target/selection, collection/target/selection clear stale rows, el/en. Κανένα console error. Backend αμετάβλητο, regression checks στο CI.

## Searching education (#120)

Η shared Algorithm Library εμφανίζει Linear/Binary/Jump/Exponential μέσω FamilyEducation και EducationalContent, ανεξάρτητα από τη φόρτωση του backend catalogue. Versioned el/en metadata: what/intuition/steps/complexity/strengths/limitations/uses/pitfalls/completeness και explicit preconditions. Τα κοινά walkthroughs στο [1,3,5,7,9,11,13,15]/11 ελέγχονται απέναντι στις πραγματικές implementations, μαζί με probes/counters και immutability. Διαχωρίζονται algorithm state, trace memory και validation cost· δεν εξάγεται performance ranking. Rendering tests ελέγχουν completeness και missing optional fields χωρίς invented content. Δεν προστίθεται runtime AI, API ή persistence.

Validation #120 (13/10/2026): 112 frontend tests, lint/build και diff check PASS. Browser smoke: και οι 4 searching cards, expand/collapse, πραγματικά walkthroughs και live el/en μετάβαση. Κανένα console error. Backend αμετάβλητο· regression CI πριν το merge.

## Searching persistence (#121)

Υλοποιήθηκε POST `/api/experiments/searching/` με strict name/input/results validation και shared transactional store_experiment. Snapshot v1: browser provenance, αρχική numeric συλλογή/target, ordered algorithm identities και πλήρη results. Completed rows κρατούν found/index/correctness/probes/comparisons/time, error rows μόνο error code χωρίς fabricated metrics. Unsorted preconditions επαληθεύονται· correctness ελέγχεται έναντι του input, χωρίς rerun του algorithm. Timings/counters παραμένουν browser-reported, όχι server-verified benchmarks. Το experiment είναι failed αν υπάρχει error ή incorrect row.

UI: 1–4 algorithms για single run ή comparison, named save με shared duplicate-request/timeout controller, απομόνωση save state ανά νέο run. Κοινό history με Searching label και read-only detail από αποθηκευμένα snapshots μετά από refresh/ID, χωρίς νέο run. Input edits ακυρώνουν το προηγούμενο save UI. Sorting/pathfinding παραμένουν συμβατά. Απαιτείται `python backend/manage.py migrate` για το migration 0006 (family choice). Δεν προστίθενται accounts/edit/delete/animation-state persistence/string search.

Validation #121: 114 frontend / 122 backend tests, lint/build, Django check και migration consistency επιτυχή. Browser smoke: αποθήκευση πραγματικού comparison ως #17, refresh/history/reopen με ίδιες μετρήσεις, run disabled και console χωρίς errors. Migration 0006 εφαρμόστηκε τοπικά.

## Comprehensive searching coverage (#122)

Νέο deterministic oracle matrix στο tests/searching-coverage.test.mjs για Linear/Binary/Jump/Exponential. Exhaustive arrays μήκους 0–5 πάνω σε {-1,0,1}, 48 seeded collections, fractions/extreme finite values, first/middle/last/absent/duplicates. Ανεξάρτητο matching-index oracle αποδέχεται οποιοδήποτε σωστό duplicate. Έλεγχοι observer/probe bounds, input immutability, exact counter fixtures, repeated-run isolation και 10.000 στοιχεία. Unsorted matrix απορρίπτεται πριν runner/clock για sorted algorithms, ενώ Linear συνεχίζει. Invalid traces/counters ελέγχονται για κάθε identity. Δεν υπάρχουν wall-clock performance thresholds ή νέες dependencies· εκτελείται με npm test και το υπάρχον CI.

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


## String Search persistence — #135 (2026-10-17)

Ολοκληρώθηκε η αποθήκευση single run/comparison στο κοινό Experiment API/history, με versioned browser snapshots και read-only reopen. Επόμενο #136: comprehensive cross-algorithm coverage.


## Comprehensive String Search coverage — #136 (2026-10-17)

Κοινά deterministic datasets για όλους τους πραγματικούς runners: exhaustive binary strings, 300 seeded mixed UTF-16 περιπτώσεις και maximum-size regressions. Independent native first-match oracle, structural counters/traces, frozen input, επανάληψη σε αντίστροφη σειρά και failure isolation ανά θέση/phase. Χωρίς timing thresholds. Εκτελούνται από το υπάρχον npm test/CI.


## PostgreSQL preparation — #143

Environment-based PostgreSQL/SQLite selection, pinned driver και πραγματικά PostgreSQL migration/regression checks στο CI. Βλ. DEPLOYMENT.md. Hosted Neon/Render verification παραμένει ξεχωριστό βήμα.


## Production configuration — #144

Strict production env validation, explicit hosts/HTTPS origins, secure cookies/HSTS/redirect και automated deploy-check coverage. Το production δεν φορτώνει local .env. Δεν έχει δημιουργηθεί hosted service.


## Local-only execution — #145

Production/Render mode αναγκάζει `ENABLE_TRUSTED_CUSTOM_EXECUTION=False`. Και το shared API execution gate απορρίπτει PRODUCTION ανεξάρτητα από DEBUG/opt-in flags, σε direct custom benchmark και custom comparison. Structured `execution_disabled` χωρίς worker spawn. Το UI εξηγεί public-demo περιορισμό/local clone και κλειδώνει τα execution controls μετά από denial (refresh μετά από αλλαγή server configuration).

Τοπικά: clone, `DJANGO_ENV=development`, `DJANGO_DEBUG=true`, explicit `ENABLE_TRUSTED_CUSTOM_EXECUTION=true`, backend σε 127.0.0.1 και allowed localhost origin. Μόνο δικός σου trusted code· δεν είναι hostile-code sandbox. Static validation και built-in benchmarks παραμένουν διαθέσιμα.


## Render preparation — #146

Blueprint, Gunicorn/WhiteNoise, fail-fast build/start και Linux CI HTTP smoke. Hosted Render health/auto-deploy pending· το issue δεν θεωρείται πλήρως κλειστό πριν από provider verification.


## Database bootstrap preparation — #147 (2026-10-18)

Direct migration URL, serialized migrations/atomic idempotent seed, startup failure propagation και PostgreSQL CI bootstrap/smoke. Το repository scope υλοποιήθηκε· actual Neon/Render provisioning και hosted verification εκκρεμούν. Τα #143–#145 ολοκληρώθηκαν, #146–#147 παραμένουν ανοιχτά μέχρι hosted validation.
