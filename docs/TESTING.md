# Testing Strategy

## Goal

Testing should protect the evaluation pipeline without becoming unnecessary maintenance overhead.

## Current backend test suite

Current verified state:

```text
36 tests
```

Run with:

```powershell
python backend\manage.py test core reviews
```

Latest verified result after local Experiment Model/API implementation:

```text
Ran 36 tests
OK
```

## Current coverage

### Algorithms API

The suite verifies that:

- five seeded sorting algorithms are returned,
- complexity metadata is returned correctly,
- only active built-in implementations are returned,
- custom implementations do not leak into the public list,
- inactive built-in implementations do not leak into the public list,
- algorithms without an active built-in implementation are excluded,
- `registry_key` is not exposed.

### Seed command

The suite verifies that:

```text
seed_sorting_algorithms
```

is idempotent.

Repeated execution should not create duplicate:

- Problems
- Algorithms
- AlgorithmImplementations

## Test database

Django tests use a temporary test database.

Running:

```powershell
python backend\manage.py test core reviews
```

does not modify the normal development SQLite database.

## Testing layers

### 1. Unit tests

Use for isolated logic:

- dataset generators,
- sorting implementations,
- benchmark metric calculations,
- statistics helpers,
- registry resolution.

### 2. API tests

Use for REST contracts:

```text
/api/algorithms/
future experiment endpoints
future results endpoints
```

Verify:

- status code,
- response structure,
- filtering,
- validation,
- hidden internal fields,
- errors.

### 3. Integration tests

Use for important end-to-end backend flows.

Target future flow:

```text
Create experiment
    ↓
Generate dataset
    ↓
Resolve implementation
    ↓
Run benchmark
    ↓
Calculate metrics
    ↓
Store result
    ↓
Return result through API
```

## Frontend testing

Current frontend verification is primarily:

- TypeScript/build verification through `npm run build`,
- manual browser testing,
- real backend integration testing.

A dedicated frontend testing framework has not yet been established.

Add one when frontend behavior becomes complex enough to justify it.

## Current manual verification

Verified on 2026-09-13 using the real local Django server and the browser:

| Scenario | Steps | Observed result |
| --- | --- | --- |
| Initial success | Start backend and frontend, open page | Five algorithm cards with complexity metadata |
| Connection failure | Stop backend, reload page | Library error message and New attempt button |
| Failed retry | Keep backend stopped, select New attempt | Loading, then error and retry button again |
| Recovery | Restart backend, select New attempt without refresh | All five cards return |
| Health loss | With page open, stop backend | Header changes to unavailable without refresh |
| Health recovery | Restart backend without refreshing page | Header changes to available automatically |

Stop only the development server started for the test (Ctrl+C in its terminal),
then restart it with the same command. Leave the backend running after recovery.
Health checks are scheduled five seconds after the previous check completes;
a request may take up to another five seconds to time out.

These are browser verification results, not automated frontend tests. The empty
response, delayed-request timeout, and component-unmount cleanup scenarios were
not separately exercised in this session. Do not infer those results from lint
or build success. No full browser-console audit was performed.

The lint/build checks passed after the fixes. ESLint excludes `backend/.venv`;
the check should inspect application code rather than installed Python packages.

Algorithm Library checks include:

- backend running,
- frontend running,
- algorithms endpoint reachable,
- all five sorting algorithms visible,
- complexity metadata visible,
- built-in implementation visible,
- basic responsive behavior,
- no obvious functional errors.

## Benchmark testing principles

When the benchmark engine is implemented, distinguish:

### Correctness

Does the algorithm return the correct result?

### Orchestration

Does the runner:

- copy inputs correctly,
- run the configured number of times,
- collect timings,
- isolate algorithms from each other's mutations?

### Statistics

Are mean, min, max, and median calculated correctly?

Do not test for exact execution times. Timing is environment-dependent.

## Pre-PR checks

Recommended:

```powershell
npm run lint
npm run build
python backend\manage.py check
python backend\manage.py test core reviews
python backend\manage.py makemigrations --check --dry-run
git diff --check
```

## Testing rules

- Every reliable bug should be considered for a regression test.
- Every new public API contract should have API coverage.
- New pure benchmark/data logic should have focused unit tests.

## Dataset tests

Eleven tests in `backend/core/datasets/tests.py` cover reproducibility, ordering,
contents, size limits, validation, global RNG isolation and independent copies.
They use `SimpleTestCase` without a database. See [Datasets](DATASETS.md).

## Benchmark verification

Eight new tests cover Bubble Sort, timing boundaries, fresh inputs, correctness
failures, stats, API bounds and validation. The suite contained 44 tests before #22; the current integrated suite has 60.
See [Benchmarks](BENCHMARKS.md) for browser scenarios and measurement limits.

## Implementation reviews (#21)

Run `manage.py test core reviews` from backend (60 tests including custom Python validation).
The [review guide](IMPLEMENTATION_REVIEWS.md) records the API contract, browser
save/refresh/update scenarios and verification limitations.

## Results dashboard (#20)

Run `npm test` for the four rendering regression tests; requires Node 22.15+.
See [Results dashboard](RESULTS_DASHBOARD.md) for browser scenarios and limits.

## Experiment tests

Eleven new tests cover relationship persistence, defaults, catalogue IDs, bounds,
invalid inputs, atomic rollback, draft creation without execution, status DB
constraint and unsupported mutation methods. Real HTTP create/read was also
verified locally. See [Experiments](EXPERIMENTS.md).

## Έλεγχος τεκμηρίωσης #12 — 2026-09-25

Στο dev-based branch του README πέρασαν 44 backend tests, 4 frontend tests,
ESLint, production build, Django check και migration dry-run. Ελέγχθηκαν τα
relative links, τα explicit anchors και το screenshot του README. Έγινε
πραγματικό browser benchmark με Random/100/42 και επιβεβαιώθηκε η εμφάνιση
αποτελεσμάτων και της Algorithm Library. Το screenshot ελέγχθηκε οπτικά.
Δεν αλλάζει application code και δεν προστέθηκαν νέα tests. Οι εντολές checks
επαληθεύτηκαν στο υπάρχον local environment· δεν έγινε clean-machine reinstall.
Οι 44 έλεγχοι αφορούσαν το αρχικό branch του README πριν το integration του #22.
Το συνδυασμένο snapshot περιλαμβάνει 60 backend tests και τις δύο ενότητες τεκμηρίωσης.

## Custom Python validation (#22)

On 2026-09-25, `manage.py test core reviews` passed all 60 tests (16 new).
Coverage includes UTF-8 boundary sizes, strict solve signatures, syntax positions,
no execution by the API, malformed requests, returning/in-place sorting,
incorrect output, runtime errors, explicit CLI opt-in, and real infinite loops
at module load and function call terminated by the 2-second timeout.
The four existing frontend tests, lint/build, Django checks and migration dry-run passed.

Browser verification against the real local backend covered valid code, missing
solve, syntax errors with Greek messages and positions, and disabled submission
above the byte limit. No browser console errors were observed. A direct CLI
check returned exit 0 for valid code and exit 1 with `timeout` for an infinite
loop. Infinite-loop behavior was also checked by real automated subprocess tests;
the UI is static-only.
No new automated frontend interaction suite, delayed-response/unmount test or
adversarial sandbox audit is claimed. See [Custom Python](CUSTOM_PYTHON.md).

## Integration PR #38 + #39 — 2026-09-25

Μετά το merge του dev στο README branch και την επίλυση των τεσσάρων docs
conflicts, πέρασαν ξανά 60 backend tests, 4 frontend tests, lint/build, Django
check και migration dry-run. Διατηρήθηκαν και οι δύο ενότητες τεκμηρίωσης.

## Επαλήθευση #11 — 2026-09-28

Πέρασαν 9 frontend tests (5 νέα), 60 backend tests, lint/build, Django check και
migration dry-run. Στον browser ελέγχθηκαν default Ελληνικά, αλλαγή σε English
και επιστροφή, localized benchmark results και ήδη υπάρχον validation error.
Διατηρήθηκαν source, αποτέλεσμα benchmark, grid wall και μη αποθηκευμένο review
draft. Το draft δεν αποθηκεύτηκε στη βάση. Το document lang/title ακολουθεί τη
γλώσσα και το refresh επιστρέφει στο el. Δεν παρατηρήθηκαν console errors.
Δεν έγινε ξεχωριστό delayed-request ή offline end-to-end σενάριο κατά την
αλλαγή γλώσσας. Τα tests rendering δεν υποκαθιστούν τα browser interaction checks.

## Επαλήθευση #41 — Sorting selection

Πέρασαν 65 backend tests και 10 frontend tests, lint/build, Django check και
migration dry-run. Καλύπτονται Insertion Sort edge cases, όλοι οι dataset generators,
dispatch των δύο algorithms, fresh copies, timing boundaries, λάθος αποτελέσματα,
invalid/missing algorithm και compatibility του αρχικού Bubble endpoint.
Τα rendering tests ελέγχουν mixed algorithm results και error/timeout labels σε el/en.
Στον browser εκτελέστηκαν Bubble Sort και Insertion Sort με random size 100, seed 42:
και οι δύο επέστρεψαν correct για 10 runs. Η αλλαγή selector και el→en→el διατήρησε
την ταυτότητα και τις μετρήσεις των προηγούμενων γραμμών. Δεν εμφανίστηκαν console errors.
Δεν έγινε νέο πραγματικό 30-second timeout ή delayed-request/unmount σενάριο.

## Επαλήθευση #43

75 backend tests πέρασαν, με 10 νέα execution tests: τέσσερα πραγματικά pairs,
GET χωρίς rerun, conflict σε repeated/non-draft run, runtime limits, stale catalogue,
registry identity mismatch, missing definitions, safe runner failure, incorrect output,
rollback μετά από partial storage write και ανθεκτικά snapshots μετά από διαγραφές.
Δεν έγινε πολυδιεργασιακό concurrency/load test· το execution παραμένει synchronous local MVP.

Το migration 0004 εφαρμόστηκε επιτυχώς στην τοπική βάση. Django check και migration
dry-run πέρασαν. Τα 10 frontend regression tests παραμένουν επιτυχή.

Lint/build πέρασαν. Smoke check μέσω Django APIClient στην migrated local βάση
επαλήθευσε create 201, run 200 με δύο saved pairs, GET 200 με ίδια δεδομένα και
repeat 409. Το προσωρινό experiment αφαιρέθηκε με transaction rollback.
Δεν έγινε νέο browser flow: το feature αφορά backend API και μία διευκρίνιση UI κειμένου.

## Επαλήθευση #45 — Experiment UI

76 backend tests και 12 frontend tests πέρασαν, μαζί με lint/build, Django check,
migration dry-run και diff check. Νέο capability test ελέγχει true για trusted
Bubble/Insertion, false για unsupported/unknown registry και απόκρυψη registry_key.
Rendering tests καλύπτουν snapshots μετά από catalogue deletion, incorrect output,
runner failure, draft χωρίς invented metrics και translation parity.

Browser στο πραγματικό local backend: save draft με δύο implementations, run,
completed status με δύο rows, disabled rerun, αλλαγή el→en, page refresh και άνοιγμα
με ID 2 επέστρεψαν ίδιες μετρήσεις. Χωρίς console errors. Το sample experiment
`Smoke #45 — Bubble και Insertion` παραμένει στη local βάση για επανάληψη ελέγχου.
Δεν έγινε νέο πραγματικό timeout/offline/unmount ή automated interaction suite.

## Επαλήθευση #47 — Experiment history

81 backend tests και 14 frontend tests πέρασαν, όπως lint/build, Django check,
migration dry-run και diff check. Πέντε νέα backend tests ελέγχουν empty/exact-page,
23-row pagination με ενδιάμεση εισαγωγή, ένα bounded query χωρίς relations, invalid
queries, missing cursor row και listing χωρίς execution. Δύο frontend rendering
tests ελέγχουν localized summaries, escaped names, disabled controls και empty state.

Browser: άνοιγμα του saved #2 από τη λίστα, save/run του sample #3 με αυτόματη
ανανέωση history σε completed, el/en, next/previous σε 11 rows και διατήρηση δεύτερης
σελίδας κατά αλλαγή γλώσσας. Οι οκτώ προσωρινές pagination εγγραφές αφαιρέθηκαν.
Το sample #3 `Smoke #47 — Ιστορικό` παραμένει στη local βάση για review.
Σταμάτημα backend → history error με διατήρηση detail → restart → retry ανέκτησε
τη λίστα. Τα αναμενόμενα network errors αυτού του offline ελέγχου δεν είναι application
exceptions. Δεν έγινε νέο πραγματικό 15-second timeout ή automated browser suite.


## Selection Sort (#51)

Regression coverage: edge cases, τέσσερις dataset types έως 1000 items, fresh copies/timing boundaries, incorrect result, πραγματικό API και persisted create/run/get. Frontend rendering ελέγχει το option σε el/en.


## Merge Sort (#52)

Ίδια κάλυψη με Selection: edge cases/τέσσερα datasets έως 1000, fresh copies/timing, incorrect output, API και persisted round trip. Το frontend render test καλύπτει το option σε el/en.


## Quick Sort (#53)

Κάλυψη correctness έως το όριο 1000, επιπλέον algorithm-only stress 3000 χωρίς recursion, duplicate-heavy inputs και άνισα μεγέθη. API, fresh copies/timing, incorrect result, persisted round trip και el/en selector. Το API εξακολουθεί να απορρίπτει unknown algorithms και το execution πέντε pairs.


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

## Pathfinding correctness (#10)

Το npm test περιλαμβάνει tests/pathfinding.test.mjs: cardinal neighbours/edges/walls, reconstruction/no-path/cycles, BFS processing order, shortest route, blocked paths, same-cell/reversed endpoints και isolation. Ανεξάρτητο Floyd–Warshall oracle (χωρίς production neighbours/reconstruction) ελέγχει και τα 512 layouts grid 3×3, όλα τα walkable start/end pairs: 11.520 cases. Ελέγχονται reachability, shortest length, adjacency, visited uniqueness και πλήρης reachable component όταν δεν υπάρχει path. Επιπλέον open grid 100×100 καλύπτει το όριο 10.000 cells, χωρίς wall-clock performance assertion. Δεν αποδεικνύει όλους τους μελλοντικούς algorithms ή UI animation.

Το #4 προσθέτει tests για frame order, markers/walls, immutability, completion/no-path/error, restart cleanup και localized BFS controls. Manual smoke ελέγχει το πραγματικό production build.

Το #5 ελέγχει σε el/en ότι όλα τα grid/toolbar controls γίνονται disabled κατά το running και διαθέσιμα εκτός animation (με comparison μονίμως unavailable μέχρι #9). Browser smoke ελέγχει running/completion/no-path και αλλαγή γλώσσας χωρίς απώλεια playback.

Το #7 προσθέτει el/en rendering tests για algorithm identity, measured fields, decimal formatting, no-path/null έναντι zero-length/zero-time και hidden panel σε idle/running/error. Τα metrics διαβάζονται από result, χωρίς DOM counting ή animation timing.

Το #8 προσθέτει DFS deterministic order και μεγαλύτερη route από BFS, wall/no-path/same-cell/reversed inputs και 10.000-node chain χωρίς recursion. Η exhaustive suite επαληθεύει DFS reachability και structural path validity για τα ίδια 11.520 cases, χωρίς απαίτηση shortest path. Rendering tests καλύπτουν DFS selector/result identity σε el/en.

Browser smoke (#8, 2026-10-06): στο production build επιλέχθηκε DFS/fast, ο selector κλείδωσε κατά το animation και τα τελικά statistics έδειξαν DFS, found=true, 140 visited nodes και 139 βήματα στο default grid. Η αλλαγή σε BFS έκρυψε τα προηγούμενα statistics και νέο DFS run ολοκληρώθηκε κανονικά. Ο χρόνος εκτέλεσης είναι μεταβλητός και δεν χρησιμοποιείται ως assertion.

Pathfinding comparison (#9): πραγματικό registry BFS/DFS σε found/no-path/same-cell grids, ίδιο input χωρίς mutation, ξεχωριστά outputs και injected-clock timings. El/en table tests για identities, lengths, visited, zero times, null length και error rows χωρίς πλαστά metrics. Toolbar comparison enabled σε idle και disabled σε running.

Browser smoke (#9, 2026-10-07): production build, default grid BFS 19 βήματα/391 visited και DFS 139/140, χωρίς animation marks. Αλλαγή el/en διατήρησε τα ίδια metrics. Grid edit έκρυψε παλιό table· τέσσερα walls γύρω από start έδωσαν no-path/1 visited και στους δύο. Το Compare κλείδωσε στο animation και μετά καθάρισε trace/single-run statistics πριν εμφανίσει νέο table. 53 frontend tests, lint και build επιτυχή.

Dijkstra (#90): unit-cost agreement με BFS, weighted detour μικρότερου κόστους/περισσότερων βημάτων, zero-cost cycles, fractions, walls/no-path/start=end, repeated-run isolation και 10.000-cell path. Ανεξάρτητο Floyd–Warshall oracle σε 80 deterministic weighted 3×3 grids ελέγχει όλα τα walkable start/end pairs. Invalid costs απορρίπτονται πριν από clock/search, weighted snapshots είναι frozen/isolated, comparison συνεχίζει μετά από mutation failure και Dijkstra result γίνεται δεκτό από playback. Συνολικά 57 frontend tests. Δεν προστίθεται UI feature στο #90· terrain/controls ακολουθούν στο #92.

A* (#91): 60 frontend tests συνολικά. Κοινό independent Floyd–Warshall oracle για Dijkstra/A* σε 80 deterministic weighted grids και όλα τα walkable start/end pairs, έλεγχοι admissibility και consistency της Manhattan. Dedicated scenarios: unit costs, weighted detour, fractional scaling (όπου unscaled Manhattan αποτυγχάνει), zero minimum με Dijkstra-equivalent trace, walls excluded από minimum, no-path/start=end, deterministic runs/isolation, 10.000-cell path και λιγότερα visited σε συγκεκριμένο open grid. Injected clocks/invalid costs/comparison/playback διατηρούν κοινό contract. Τα Dijkstra regression tests επαληθεύουν την εξαγωγή shared min-heap. Δεν υπάρχει νέο browser UI flow στο #91.

Weighted terrain (#92): 63 frontend tests. Paint/wall/clear/reset input mapping, start exclusion/end inclusion στο cost, no-path null/start=end zero, invalid terrain rejection, preservation κατά το animation και ανεξάρτητα snapshots. Weighted detour: BFS 2 βήματα/cost 6, Dijkstra/A* 4 βήματα/cost 4. Registry εκτελεί και τους τέσσερις με ξεχωριστά timings, el/en cells εμφανίζουν terrain/cost και ο πίνακας διαχωρίζει βήματα από cost.

Validation #92 (2026-10-09): 63 tests, lint και production build επιτυχή. Το interactive browser smoke δεν ολοκληρώθηκε: ο browser automation process δεν εκκινεί λόγω environment setup error, ακόμη και μετά από reset. Τα component rendering/domain/playback tests πέρασαν· η οπτική επιβεβαίωση παραμένει μη επαληθευμένη σε αυτό το session.

## Pathfinding education (#93)

`npm test`: 66 tests. Νέα coverage: metadata keys = executable registry, πλήρες el/en περιεχόμενο, πραγματικά paths/costs των walkthroughs, συμφωνία παραδειγμάτων με εμφανιζόμενα κείμενα, Library rendering ενώ το API φορτώνει και ασφαλές fallback για missing language/optional fields. Existing sorting education tests παραμένουν πράσινα. `npm run lint` και `npm run build` περνούν.

Manual smoke προς επαλήθευση: άνοιγμα Library, expand κάθε card, αλλαγή el/en, narrow viewport και διαθέσιμα pathfinding cards με backend offline. Δεν δηλώνεται ως επιτυχές: στις 2026-10-09 η browser automation απέτυχε πριν συνδεθεί με tab (kernel startup error).

## Pathfinding persistence (#94)

114 backend tests: save/list/detail, catalogue independence, no-rerun, null/zero semantics, malformed/bounded payloads, transaction rollback και sorting compatibility. 68 frontend tests: frozen independent capture, save/list/get API contract, πραγματικό result → persisted view, el/en history/rendering με searches που πετούν exception αν κληθούν κατά το reopen. Lint/build και Django check/makemigrations --check περνούν.

Browser smoke 2026-10-10 στο production preview: νερό cost 5 στο (0,0), Compare BFS/DFS/Dijkstra/A*, Save ως “Smoke #94 — weighted comparison” (#14), refresh, κοινό history → reopen. Οι χρόνοι 1.4/0.6/1.9/0.8 ms και paths/costs παρέμειναν ίδια. Το αποθηκευμένο grid είχε το cost 5, ενώ το νέο live grid επέστρεψε στα defaults. El/en και disabled run στο αποθηκευμένο record επαληθεύτηκαν. Αρχικό Vite dev timeout αντιμετωπίστηκε με production preview.

## Shared evaluation (#95)

Νέα tests καλύπτουν duplicate-submit/saved guards, failure/timeout retry, cancellation/late-response isolation και compile-time απόρριψη ανταλλαγής sorting/pathfinding metrics. Shared backend tests καλύπτουν ανεξάρτητα snapshots, completed/failed status και rollback για τις δύο families. Τα existing signed sorting και browser pathfinding save/list/reopen regression tests παραμένουν ενεργά.

Validation #95: 117 backend / 72 frontend tests, lint/build, Django check και migration drift check επιτυχή. Browser smoke 2026-10-10: sorting comparison αποθηκεύτηκε ως #15 και pathfinding ως #16 μέσω των shared save/storage flows. Μετά από refresh, και τα δύο άνοιξαν από το κοινό history με persisted results και disabled rerun. Δεν απαιτείται migration.

## Searching contracts (#96)

Το tests/searching.test.mjs ελέγχει numeric inputs/limits, frozen snapshots, sorted preconditions πριν από timing, found/correct/index semantics, duplicates/empty/absent targets, malformed traces, probe/comparison counters, runner/clock errors και same-input failure isolation. Οι injected test runners είναι contract fixtures, όχι υλοποιήσεις των planned algorithms. Δεν υπάρχει νέα UI ροή για browser smoke σε αυτό το foundation.

Validation #96: 78 frontend και 117 backend tests επιτυχή, lint/build, Django check και migration drift check καθαρά. Δεν αλλάζει UI/API/schema και δεν απαιτείται migration.

## String-search contracts (#97)

tests/string-search.test.mjs: bounded immutable inputs, first-match/empty/repeated/overlapping semantics, literal UTF-16 offsets, malformed results/counters, διακριτά phase timings/errors και same-input comparison. Τα fixtures δεν είναι πραγματικοί algorithms. Δεν αλλάζει UI/API/schema και δεν απαιτείται migration ή νέα browser smoke ροή.

Validation #97: 85 frontend και 117 backend tests επιτυχή, lint/build, Django check και migration drift check καθαρά. Δεν απαιτείται migration.

## Shared education (#98)

Το language.test.mjs καλύπτει legacy sorting/pathfinding και searching/string-search extension fixtures σε el/en, ασφαλές empty/missing fallback, escaped code, walkthrough preservation και input immutability. Browser smoke επιβεβαίωσε BFS/Bubble Sort και αλλαγή γλώσσας χωρίς console errors. 87 frontend tests και lint/build επιτυχή.

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

Νέα tests για four-algorithm success στο ίδιο input, not-found/empty/zero-index, unsorted mixed results, invalid selection/numeric input, el/en dictionaries, semantic table headers και explicit runtime/precondition/clock errors χωρίς fabricated metrics. Ορθότητα και found ελέγχονται ανεξάρτητα.

Validation #119 (13/10/2026): 109 frontend tests PASS, lint/build και diff check PASS. Browser: 4 sorted successes, unsorted Linear + 3 precondition errors, not-found/empty, invalid target/selection, collection/target/selection clear stale rows, el/en. Κανένα console error. Backend αμετάβλητο, regression checks στο CI.

## Searching education (#120)

Η shared Algorithm Library εμφανίζει Linear/Binary/Jump/Exponential μέσω FamilyEducation και EducationalContent, ανεξάρτητα από τη φόρτωση του backend catalogue. Versioned el/en metadata: what/intuition/steps/complexity/strengths/limitations/uses/pitfalls/completeness και explicit preconditions. Τα κοινά walkthroughs στο [1,3,5,7,9,11,13,15]/11 ελέγχονται απέναντι στις πραγματικές implementations, μαζί με probes/counters και immutability. Διαχωρίζονται algorithm state, trace memory και validation cost· δεν εξάγεται performance ranking. Rendering tests ελέγχουν completeness και missing optional fields χωρίς invented content. Δεν προστίθεται runtime AI, API ή persistence.

Validation #120 (13/10/2026): 112 frontend tests, lint/build και diff check PASS. Browser smoke: και οι 4 searching cards, expand/collapse, πραγματικά walkthroughs και live el/en μετάβαση. Κανένα console error. Backend αμετάβλητο· regression CI πριν το merge.

## Searching persistence (#121)

Backend: save/list/reopen, zero/null/incorrect outcomes, mixed errors, strict invalid payloads και atomic rollback. Frontend: detached snapshots, single run, bilingual saved detail χωρίς clock execution, shared save lifecycle και sorting/pathfinding regressions.

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


## String Search persistence — #135

Frontend: detached/frozen snapshots, single selection, localized save/read-only details και type narrowing. Backend: save/list/reopen χωρίς execution, errors/incorrect first match, empty/absent, Unicode astral και isolated surrogates, strict malformed payload rejection και atomic rollback. Regression suite καλύπτει και τις υπάρχουσες families.


## Cross-algorithm regressions — #136

Το `tests/string-search.test.mjs` ελέγχει 127 binary texts × 31 patterns για όλους τους runners, 300 seeded mixed UTF-16 datasets, ρητά boundary/Unicode/collision fixtures και τέσσερα maximum-size inputs. Κάθε case τρέχει και με αντίστροφη σειρά algorithms, με independent `String.indexOf` oracle και deterministic injected clock. Ελέγχονται immutable inputs, safe counters, valid offsets, first occurrence, detached results και failure isolation σε κάθε comparison θέση. Δεν υπάρχουν performance thresholds ή αλλαγές στο CI configuration.


## Deployment checks (#143–#147)

SQLite και PostgreSQL 17 backend suites, production check --deploy χωρίς warnings, direct/mixed custom execution denial, provider port validation, fresh/repeated bootstrap, idempotent seed/history preservation και Linux Gunicorn HTTP health/static/catalogue smoke. Τα CI results δεν υποκαθιστούν hosted Render/Neon verification.


## Research Console checks (#168, 2026-10-20)

- 154 frontend tests: περιλαμβάνουν hash validation/fallback, visited-state retention,
  ένα αρχικά ορατό workspace, localized navigation/utilities, Sorting tool semantics.
- Manual browser smoke σε production preview με local Django: sorting benchmark 20
  στοιχείων, αλλαγή workspace/επιστροφή με διατήρηση input, Pathfinding comparison,
  Searching και String Search load/step/comparison, Library, υπάρχον history snapshot reopen.
- Έλεγχος el/en και responsive 320px σε όλες τις επτά ενότητες: document scrollWidth
  ίσο με clientWidth (305px usable λόγω scrollbar). Tables/grid/strings έχουν contained scroll.
- Νέα screenshots desktop/mobile στο `docs/images/`. Δεν γράφτηκαν νέα history records.
- Τοπικό preview χρησιμοποιεί προσωρινή CORS allowance για 127.0.0.1:4173 μόνο στη
  διεργασία QA· δεν τροποποιήθηκε κανένα .env ή production setting.
