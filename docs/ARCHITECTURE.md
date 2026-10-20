# Architecture

## Architectural style

The project uses a **modular monolith**.

The application remains one backend and one frontend, while responsibilities are separated into clear modules. Microservices are intentionally avoided at the current scale.

## High-level architecture

```text
+-----------------------------+
|       React Frontend        |
|                             |
| Algorithm Library           |
| Dataset Builder             |
| Experiment Builder          |
| Results Dashboard           |
| Visualizer                  |
+-------------+---------------+
              |
              | REST / JSON
              v
+-----------------------------+
|       Django Backend        |
|                             |
| Algorithms                  |
| Datasets                    |
| Experiments                 |
| Benchmarks                  |
| Results                     |
+-------------+---------------+
              |
              v
+-----------------------------+
|          Database           |
|                             |
| Problems                    |
| Algorithms                  |
| Implementations             |
| Experiments                 |
| Results                     |
+-----------------------------+
```

## Frontend

Current technologies:

- React 19
- TypeScript 6
- Vite 8
- CSS
- Fetch API

Current important structure:

```text
src/
├── components/
│   ├── AlgorithmLibrary/
│   ├── AppHeader/
│   ├── BackendStatus/
│   ├── Grid/
│   └── Toolbar/
├── i18n/
│   └── translations.ts
├── services/
│   └── apiClient.ts
├── types/
│   └── algorithm.ts
├── utils/
├── App.tsx
└── main.tsx
```

Planned growth:

```text
src/
├── components/
│   ├── DatasetBuilder/
│   ├── ExperimentForm/
│   ├── BenchmarkResults/
│   ├── Charts/
│   └── Visualizer/
├── types/
│   ├── dataset.ts
│   ├── experiment.ts
│   └── benchmark.ts
└── ...
```

Do not create empty modules before they are needed.

## Backend

Current technologies:

- Django 5.2.16
- Django REST Framework 3.17.1
- SQLite

Current important structure:

```text
backend/core/
├── management/
│   └── commands/
│       └── seed_sorting_algorithms.py
├── migrations/
├── models.py
├── serializers.py
├── tests.py
├── urls.py
└── views.py
```

Planned modular growth:

```text
backend/core/
├── algorithms/
│   ├── registry.py
│   └── sorting/
├── datasets/
│   └── generators.py
├── benchmarks/
│   ├── runner.py
│   └── metrics.py
└── ...
```

If the domain grows enough, modules may later become separate Django apps.

## Domain model

### Problem

Represents the family/problem category an algorithm solves.

Current example:

```text
Sorting
```

Future examples:

```text
Searching
Graph Traversal
Shortest Path
String Matching
```

### Algorithm

Represents the theoretical algorithm concept.

Current metadata includes:

- problem
- name
- slug
- description
- best-case complexity
- average-case complexity
- worst-case complexity
- space complexity
- timestamps

### AlgorithmImplementation

Represents an executable implementation of an algorithm.

Example:

```text
Algorithm:
  Quick Sort

Implementation:
  Built-in Python
```

The separation allows future variants:

```text
Quick Sort
├── Reference Python
├── Optimized Python
└── Custom implementation
```

## Algorithm registry

Executable functions should not be stored in the database.

Planned pattern:

```python
ALGORITHM_REGISTRY = {
    "sorting.bubble_sort": bubble_sort,
    "sorting.selection_sort": selection_sort,
    "sorting.insertion_sort": insertion_sort,
    "sorting.merge_sort": merge_sort,
    "sorting.quick_sort": quick_sort,
}
```

The database stores a `registry_key`, and the backend resolves it to trusted Python code.

## Current data flow: Algorithm Library

```text
SQLite
  ↓
Django Model
  ↓
DRF Serializer
  ↓
GET /api/algorithms/
  ↓
Fetch API
  ↓
TypeScript Algorithm[]
  ↓
React AlgorithmLibrary
```

## Planned data flow: Experiment

```text
React Experiment Form
  ↓
Experiment API
  ↓
Dataset Generator
  ↓
Algorithm Registry
  ↓
Benchmark Runner
  ↓
Metrics
  ↓
Persistence
  ↓
Results API
  ↓
React Dashboard
```

## Benchmark principles

Benchmarks should:

- run equivalent input for compared algorithms,
- avoid sharing a mutated dataset,
- use repeated runs,
- store dataset type and input size,
- report summary statistics,
- keep benchmark logic separate from API views.

## Database strategy

Current development database:

```text
SQLite
```

Potential production database:

```text
PostgreSQL
```

## API boundary

Frontend components should use the centralized API client:

```text
React component
    ↓
apiClient.ts
    ↓
Django REST API
```

## Frontend request lifecycle

`AlgorithmLibrary` loads on mount and retries when the user selects New attempt.
Loading state is initialized on mount and reset by the retry event handler.
Effect cleanup ignores stale responses; it does not cancel algorithm requests.

`BackendStatus` independently polls the health endpoint. It waits five seconds
after each settled request before checking again, with a five-second request
timeout. Cleanup clears timers and aborts the active request. Background checks
preserve the last status until a new result arrives. A recovered health check
does not automatically reload the Algorithm Library; its retry button does that.

## i18n

Greek and English translation structures already exist.

Το App κρατά ένα language state (`el` / `en`), με default Ελληνικά. Το header
ενημερώνει το state και οι ενότητες λαμβάνουν language/texts μέσω props.
Δεν αλλάζουν component keys ή request dependencies όταν αλλάζει η γλώσσα,
ώστε να διατηρούνται τα form drafts και results. Το document lang και ο τίτλος
ακολουθούν την επιλογή. Τα static Python error codes μεταφράζονται στο render·
το API contract και τα αποθηκευμένα δεδομένα δεν αλλάζουν. Βλ. [Language](LANGUAGE.md).

## Dataset utility (Issue #17, local implementation)

`backend/core/datasets/generators.py` has no Django or database dependencies.
A frozen `Dataset` retains type, size, seed and tuple values. `copy_for_run()`
provides independent mutable inputs. See [Datasets](DATASETS.md).

## First benchmark vertical slice (local #18)

React Benchmark form -> centralized API client -> benchmark request serializer
-> pure runner -> dataset copies -> trusted Bubble Sort / Insertion Sort -> correctness and timing
summary -> result card. The endpoint has no persistence or registry lookup.
See [Benchmarks](BENCHMARKS.md).

## Experiment definitions (#19, local)

Experiment selects implementations through a many-to-many relation and owns
DatasetDefinition rows through a foreign key. API validation precedes atomic
creation of all records. Status is server-owned and defaults to draft.
Read uses prefetching for implementations, algorithms and datasets. No execution
is triggered. See [Experiments](EXPERIMENTS.md).

## Custom Python validation (#22)

React CustomPython editor -> centralized API client -> static validation API ->
AST parse/compile and signature checks -> structured result. This path never
executes or saves submitted code. The separate developer CLI opts into a child
Python process for finite correctness smoke cases with a timeout. The API does
not import the runner. There is no sandbox, database model or benchmark integration.
See [Custom Python](CUSTOM_PYTHON.md).

Issue #41 adds a fixed code allowlist before dataset generation. The sorting API takes
an algorithm identifier; no database metadata or custom source becomes executable.
The legacy Bubble endpoint delegates to the shared runner.

## Bounded experiment execution (#43)

Experiment run API → conditional draft claim → trusted registry resolution →
shared sorting runner → ExperimentResult snapshots → completed/failed.
Μία transaction περιλαμβάνει claim, bounded execution και persistence. Δεν μπαίνουν
DB writes στο timed region. Τα snapshots δεν έχουν FK προς catalogue/dataset records,
ώστε να διατηρούνται μετά από αλλαγές τους. Δεν υπάρχει worker ή νέο UI.

## Experiment UI (#45)

Experiments component → centralized create/get/run API client → experiment service.
ExperimentDetails εμφανίζει persisted snapshot measurements ανεξάρτητα από το
session ResultsDashboard. Το catalogue capability μοιράζεται resolver με execution,
με select_related για τις σχέσεις algorithm/problem. Δεν προστίθεται migration.

## Experiment history (#47)

GET collection χρησιμοποιεί ένα bounded query 11 summaries για 10 rows + next cursor,
χωρίς count ή relation prefetch. Το ExperimentHistory χειρίζεται keyset cursors,
loading/error και request cancellation. Το HistoryPage αποδίδει τις summaries.
Η επιλογή row καλεί την υπάρχουσα detail ροή. Save/run κάνουν reset του history μόνο,
διατηρώντας τη φόρμα και το επιλεγμένο experiment. Δεν προστίθεται migration.


## Sorting visualization (#64)

Ανεξάρτητο TypeScript educational trace για Bubble/Insertion/Selection/Merge/Quick, με algorithm identities του catalogue, explicit input 1–32 integers 0–999 και immutable step snapshots. Play/Pause/Step/Speed/Reset χρησιμοποιούν καθαρό reducer· αλλαγή algorithm ξαναφορτώνει το αρχικό input. Το UI εξηγεί ότι writes μπορεί να εμφανίζουν προσωρινά duplicates λόγω buffer/key εκτός array. Δεν καλείται ούτε αλλάζει ο Python benchmark runner και δεν παράγονται performance metrics από animation. Tests καλύπτουν deterministic traces, duplicates/sorted/reversed/singleton, input validation, playback transitions και el/en controls.


## Trusted custom benchmark (#67)

POST `/api/benchmarks/sorting/custom/` με source, trusted:true, size, seed, dataset_type. Disabled by default: απαιτούνται DEBUG, `ENABLE_TRUSTED_CUSTOM_EXECUTION=true`, loopback REMOTE_ADDR και επιτρεπόμενο frontend Origin. Το UI ζητά acknowledgement για δικό σου trusted code. Για προσωρινή τοπική ενεργοποίηση PowerShell: `$env:ENABLE_TRUSTED_CUSTOM_EXECUTION='true'` και restart backend στο 127.0.0.1. Μην ενεργοποιείται σε public/proxied server. Δεν αλλάζει αυτόματα το .env.

Νέος worker, ξεχωριστός από το παλιό CLI smoke: Python -I -S, προσωρινό cwd, reduced env, stdout/stderr discarded, 2 s wall timeout, ένα custom process ανά server process, input≤1000/source≤32768 UTF-8 bytes/output≤16 KiB. Unix επιπλέον 256 MiB address-space/2 s CPU/file-size limits· Windows έχει wall-time/input/output/concurrency limits, όχι OS memory isolation. **Δεν είναι hostile-code sandbox**. Static validation προηγείται· execution subset δέχεται μόνο function definitions χωρίς imports/classes/decorators/defaults/annotations, περιορισμένα built-ins και list/dict methods (core/custom_python/benchmark.py). Δεν υποστηρίζονται packages/network/I/O.

solve(values) επιστρέφει list ή None για in-place. Δέκα fresh copies, μόνο solve timed, correctness μετά κάθε run, ίδιο timing_statistics helper με built-ins. Structured validation/runtime/timeout/busy/unavailable errors, ποτέ fallback. Source/results δεν αποθηκεύονται. Tests: πραγματικά subprocess success/incorrect/exception/timeout/fresh-copy, rejection πριν process, local opt-in gates και bilingual UI acknowledgement. Η παλαιότερη περιγραφή «μόνο CLI execution» αντικαθίσταται από αυτό το opt-in flow.


## Pathfinding foundation (#65)

Κοινό GridInput/Search/PathfindingResult για bfs/dfs/dijkstra/astar, adapter από υπάρχον UI grid χωρίς DOM, frozen copies, cardinal unit-cost neighbours και same-grid evaluation utility. Found/no-path/invalid/runner error έχουν διακριτό contract. Timing μόνο του search call· path length σε ακμές, null όταν δεν υπάρχει path. Δεν προστίθενται ακόμη οι τέσσερις algorithms, animation ή persistence και δεν κλείνουν τα #1–#10. Αναλυτικό contract και όρια στο [Pathfinding](PATHFINDING.md). Tests καλύπτουν input validation, walls/markers, same-cell/no-path, invalid trace, timing boundary και copy isolation· το sorting regression suite παραμένει ενεργό.


## Shared evaluation model (#95)

Η κοινή ροή είναι input definition → family validator → πραγματική implementation → result/metrics → comparison → αποθήκευση snapshot → κοινό history/detail. Το educational content εξηγεί τη θεωρία και το visualization καταναλώνει traces· κανένα από τα δύο δεν παράγει benchmark timings.

| Concept | Shared boundary | Sorting adapter | Pathfinding adapter |
| --- | --- | --- | --- |
| Family | Experiment.family και ExperimentByFamily union | sorting, default για παλιές εγγραφές | pathfinding |
| Implementation | StoredResult identity snapshot | catalogue ID/slug/Python registry | TypeScript registry key/name/version |
| Input | Το snapshot ανήκει στο experiment | dataset definition/type/size/seed | versioned grid/walls/costs/start/end |
| Execution | Validator πριν από execution, metrics χωριστά από UI | bounded Python runner, repeated fresh arrays | pure TypeScript search, frozen grid |
| Result/metrics | StoredResult<Identity, Measurement>, ExperimentHeader | BenchmarkResult: timings_ns, correctness, distribution statistics | PathfindingResult: found, timeMs, visited, length/cost, traces |
| Comparison | Κοινό input ανά σύγκριση, ανεξάρτητα αποτελέσματα | server orchestration, errors/timeouts, baseline ratios | browser orchestration, error rows, weighted cost |
| Save | useExperimentSave / createSaveController | signed token, 15 s request timeout | captured input/results, 30 s request timeout |
| Storage | store_experiment transaction, Experiment/Result | signature/catalogue validation προηγείται, definitions/relations προαιρετικά | structural validation προηγείται, client-reported snapshots |
| History | κοινά list/get, keyset pagination, family label | sorting detail renderer | readonly grid/path detail renderer |
| Education / visualization | shared EducationalContent, rendering εκτός timing | curated backend metadata και sorting trace playback | curated domain metadata και grid trace playback |

Το `src/evaluation/contracts.ts` μοιράζεται μόνο το identity/measurement envelope και το experiment header. Το `ExperimentByFamily` αντιστοιχίζει family σε συγκεκριμένο schema· το union επιτρέπει narrowing πριν την πρόσβαση σε family-specific metrics. Δεν υπάρχει generic αριθμός “score” ή mapping no-path σε incorrect sorting. Το legacy sorting family παραμένει optional στον frontend για συμβατότητα με παλιά fixtures/responses.

Το `src/evaluation/saveController.ts` κρατά μία active request ανά mounted result: idle → saving → saved/error, αποτροπή διπλού submit και save μετά από επιτυχία, retry μετά από error, abort στο unmount, απόρριψη late responses με request identity. Το `useExperimentSave` το συνδέει με React μέσω useSyncExternalStore. Δύο πραγματικοί consumers είναι SaveComparison και SavePathfinding. Κάθε consumer κρατά δικά του payload, labels, validation, timeout και key που αλλάζει όταν εμφανίζεται νέο result. Η ακύρωση δεν αναιρεί εγγραφή που έχει ήδη γίνει στον server· το υπάρχον uncertain-save feedback συνεχίζει να ισχύει.

Το `backend/core/experiments/persistence.py::store_experiment` αποθηκεύει ήδη validated completed/failed snapshots σε μία transaction: header, optional implementations/dataset definitions, ordered result snapshots. Δεν επαληθεύει ή εκτελεί algorithms. Καλείται από τα sorting-comparison και pathfinding adapters, τα οποία κρατούν διαφορετικά trust boundaries (server signing έναντι browser measurements). Το sorting draft → run lifecycle παραμένει στο execution.py επειδή κάνει claim και execution, όχι μόνο save έτοιμου αποτελέσματος. Δεν αλλάζουν URLs, response shapes, migrations, timings ή algorithm behavior.

### Ένταξη επόμενης family

1. Ορίζουμε συγκεκριμένα input/result/metric types και registry/validator/runner, με timing έξω από rendering. Δεν προσθέτουμε κενά sorting/pathfinding πεδία.
2. Προσθέτουμε family στο model choices με migration και στο ExperimentByFamily. Έτσι τα shared experiment types επεκτείνονται με πραγματικό family-specific schema.
3. Ένας μικρός save adapter επικυρώνει το δικό του payload/provenance και καλεί store_experiment. Το frontend save control καλεί useExperimentSave με το δικό του API operation και αλλάζει key ανά result.
4. Επεκτείνουμε το family label και το detail dispatch με τον νέο renderer. List/get, pagination, atomic writes και save request lifecycle επαναχρησιμοποιούνται.
5. Προσθέτουμε family regression tests και compile-time contract assertions. EducationalContent επαναχρησιμοποιείται αν το learning structure ταιριάζει· animation παραμένει ξεχωριστό από measured execution.

Οι μελλοντικές searching/string-search families δεν υλοποιούνται εδώ. Δεν ενοποιείται το synchronous browser search με το asynchronous server benchmark μόνο για να μοιάζει ο κώδικας. Κάθε νέο shared abstraction πρέπει να αποκτήσει τουλάχιστον δύο πραγματικούς consumers.

## Searching foundation (#96)

Το ανεξάρτητο src/searching/evaluation.ts ορίζει numeric collection/target, immutable snapshots, explicit sorted preconditions και typed completed/error results. Evaluation ελέγχει correctness εκτός timing, ενώ comparison δίνει ίδιο input σε ανεξάρτητες injected implementations. Το probe trace προετοιμάζει visualization· δεν υπάρχει ακόμη searching UI/API/persistence. Τα shared save/storage boundaries του #95 θα χρησιμοποιηθούν όταν προστεθεί πραγματική persistence integration. Βλ. [Searching](SEARCHING.md).

## String-search foundation (#97)

Ξεχωριστό src/stringSearch/evaluation.ts με literal UTF-16 text/pattern input και first-match result. Το prepare(pattern) και search(text) έχουν ανεξάρτητα timings/counters, ενώ correctness και validation εκτελούνται εκτός timing. Same-input comparison επαναλαμβάνει preparation ανά entry και απομονώνει failures. Το alignment trace προετοιμάζει visualization· δεν ενεργοποιείται ακόμη UI/API/persistence. Βλ. [String search](STRING_SEARCH.md).

## Shared education (#98)

EducationMetadata → educationSections adapter → EducationalContent renderer. Τα common/extension sections είναι ανεξάρτητα από family. Sorting catalogue και pathfinding domain παραμένουν sources of truth, με legacy fields συμβατά. Το FamilyEducation αποδίδει data-driven cards για νέες families. Βλ. [Education](EDUCATION.md).

## Searching visualization (#118)

Οι τέσσερις πραγματικές implementations παρέχουν optional observer με probe, inclusive low/high και phase (scan/binary/jump/expand). Χωρίς observer διατηρούν τα ίδια metrics. Το searchingAnimation καταγράφει immutable frames έως 64 στοιχεία χωρίς clock/benchmark metrics. Linear δείχνει remaining suffix, Binary midpoint/range, Jump block boundaries και scan, Exponential expansion και binary phase. Το registry είναι η κοινή executable πηγή. UI: el/en, collection/target/algorithm, Play/Pause/Step/Reset/Speed, current/visited/range/match και σαφή precondition errors. Input/algorithm edits καθαρίζουν trace και timer, reset επαναφέρει frame 0. Pure reducer/trace tests και bilingual rendering tests ελέγχουν lifecycle, phase order, bounds και συμφωνία με πραγματικά probes. Το #119 προσθέτει ξεχωριστή measured comparison ροή.

## Searching comparison UI (#119)

SearchingComparison → runSearchingComparison → κοινό input parser/registry → compareSearching/evaluateSearching. SearchingResults αποδίδει το discriminated result contract: completed metrics ή explicit error row. Η visualization και η measured comparison έχουν ανεξάρτητο state, χρησιμοποιούν όμως ίδιες implementations. Δεν απαιτείται backend request ή migration.

## Searching education (#120)

Η shared Algorithm Library εμφανίζει Linear/Binary/Jump/Exponential μέσω FamilyEducation και EducationalContent, ανεξάρτητα από τη φόρτωση του backend catalogue. Versioned el/en metadata: what/intuition/steps/complexity/strengths/limitations/uses/pitfalls/completeness και explicit preconditions. Τα κοινά walkthroughs στο [1,3,5,7,9,11,13,15]/11 ελέγχονται απέναντι στις πραγματικές implementations, μαζί με probes/counters και immutability. Διαχωρίζονται algorithm state, trace memory και validation cost· δεν εξάγεται performance ranking. Rendering tests ελέγχουν completeness και missing optional fields χωρίς invented content. Δεν προστίθεται runtime AI, API ή persistence.


## Research Console (#168)

Το AppShell οργανώνει επτά workspaces με hash-based navigation και browser Back/Forward,
χωρίς router dependency. `navigation.ts` επικυρώνει τα IDs και κρατά visited state.
Κάθε workspace γίνεται mount στην πρώτη επίσκεψη και παραμένει mounted με `hidden`
όταν δεν είναι ενεργό: διατηρείται το state, αποκλείεται το κρυφό UI από keyboard/AT,
και υπάρχοντα requests/animations ολοκληρώνονται χωρίς αλλαγή execution contracts.
Η ίδια πολιτική ισχύει για τα τέσσερα Sorting tools. Refresh επαναφέρει τα προσωρινά
inputs/results στις defaults· persistence συνεχίζει να χρησιμοποιεί το υπάρχον API.

`src/styles/tokens.css` παρέχει χρώματα, surfaces, spacing και typography tokens.
`App.css` παρέχει shell/shared controls/panels και responsive rules, ενώ τα feature
styles κρατούν τις ιδιαιτερότητες των visualizations. Semantic algorithm-state colors
παραμένουν διακριτά από το purple interaction accent. Δεν προστίθεται γενική component
library ούτε αλλάζουν backend, algorithms ή persistence contracts.
