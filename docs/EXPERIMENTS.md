# Experiment definitions — Issue #19

The API creates/retrieves definitions (#19), and now executes bounded sorting
experiments with persisted results (#43). The standalone benchmark UI remains
session-only; #45 adds a separate saved-experiment UI.

## Models

- `Experiment`: name, selected implementations (many-to-many), status, timestamps.
- `DatasetDefinition`: an experiment-owned configuration (type, size, seed).
  It references one experiment via a foreign key; deleting the experiment also
  deletes its definitions. Arrays are generated later, not stored here.

Definitions are owned by each experiment so another experiment cannot edit its
dataset configuration. Implementation references are live catalogue records,
not versioned code snapshots. Deleting catalogue implementations through ORM/admin
removes their many-to-many selections. Execution results now retain independent identity/configuration snapshots; deleting catalogue
records or definitions does not remove those snapshots. Deleting the experiment deletes its results.

## Create

`POST /api/experiments/` accepts JSON:

```json
{
  "name": "Random and reversed inputs",
  "implementation_ids": [1, 2],
  "datasets": [
    {"dataset_type": "random", "size": 100, "seed": 42},
    {"dataset_type": "reversed", "size": 1000, "seed": 7}
  ]
}
```

Obtain actual implementation IDs from `GET /api/algorithms/`, where each nested
implementation now includes `id`. The numbers above are illustrative.

- Name: nonblank, up to 200 characters.
- 1–20 distinct implementation IDs: existing, active, built-in and sorting only.
- 1–20 distinct dataset configurations: random/sorted/reversed/nearly_sorted.
- Size: JSON integer 1–100,000. Seed: signed 32-bit JSON integer, default 42.
- Boolean/fractional/string integers, unknown fields and supplied read-only fields
  (including status or IDs for nested definitions) return HTTP 400.
- Status is always `draft` on creation; clients cannot submit status transitions.
- Invalid input creates no records. Experiment, selections and definitions are
  saved in one database transaction; storage failure rolls them all back.

HTTP 201 returns `id`, `name`, `status`, `created_at`, `updated_at`,
`implementations` and `datasets`. Implementation summaries contain id, name,
slug, algorithm slug, language, is_active and source_type, but not registry_key.
Datasets contain their stored id, type, size and effective seed. The input-only
`implementation_ids` field is not returned.

## Read

`GET /api/experiments/<id>/` returns the same representation (HTTP 200).
An unknown ID returns 404. Update and delete endpoints remain unavailable; unsupported methods return 405.

## Execution — Issue #43

`POST /api/experiments/<id>/run/` accepts an empty JSON object `{}` and returns
HTTP 200 with the full experiment, including `results` and `execution_error`.
Only draft experiments may execute. Unknown ID: 404; non-draft: 409;
invalid body/configuration: 400; unsupported HTTP method: 405.

Runtime validation requires active built-in Python implementations whose private
registry key AND sorting algorithm identity match Bubble Sort, Insertion Sort, Selection Sort, Merge Sort or Quick Sort.
No dynamic imports or custom code are allowed. Drafts can still contain other
catalogue entries, but those cannot run. Each dataset must have 1–1000 items,
and the implementation × dataset product must be 1–4 pairs. Validation failure
rolls back the claim, leaving a draft with no results.

Each pair runs through the existing runner (10 fresh copies, sorting-only timing).
`results` contains id, created_at, implementation_snapshot (id/name/slug/algorithm/language)
and measurement (algorithm/dataset_type/size/seed/runs/correct/timings_ns/median_ns/min_ns/max_ns).
These snapshots survive changes/deletion of catalogue records and dataset definitions.
They are not code-version or environment snapshots and do not guarantee replay of timings.

Server-owned transitions are draft → running → completed/failed. A conditional
update claims the draft in one database transaction, held through the bounded execution
and result writes. Running is therefore internal, not a progress/polling signal.
SQLite serializes writers; a concurrent request may wait or receive a database-lock
error. This is a local MVP, not a production worker/queue design.

- All correctness checks pass: completed, empty execution_error, all results saved.
- Incorrect sorting: failed, `incorrect_result`, measured results retained and labelled false.
- Runner exception: failed, `runner_error`, no partial results or exception details exposed.
- Storage failure/process interruption before commit: transaction rolls back to draft;
  a later request may execute again. This is not exactly-once execution across crashes.
- Completed and failed experiments cannot rerun. Create a new draft for another attempt.

GET returns persisted results without execution. Create accepts neither results nor
execution_error/status from clients. No authentication/ownership, async scheduling,
cancellation or public concurrency guarantee is provided. The 100,000-item draft
limit is independent of the 1000-item execution limit.

## Migration #43

Run `python backend/manage.py migrate` to apply
`0004_experiment_execution_error_experimentresult`. This adds a result table and
an empty-by-default error field; existing draft definitions remain valid.

## Original #19 verification

Migration: `0003_experiment_definitions`. Run:

```powershell
.\backend\.venv\Scripts\python.exe backend\manage.py migrate
.\backend\.venv\Scripts\python.exe backend\manage.py test core
```

Eleven new tests cover create/read persistence and relationships, catalogue IDs,
defaults/bounds, invalid selections/configurations, duplicates, rollback,
no benchmark execution, status constraint and unsupported mutations. The full
suite contains 36 tests. Migration application, checks and dry-run are verified
locally. No frontend behavior changes beyond adding the implementation ID type.

## UI — #45

Η ενότητα Αποθηκευμένα experiments προσφέρει όνομα, επιλογή implementations από
το catalogue `executable` flag και ένα dataset (1–1000, type/seed). Save draft και
Run είναι χωριστές ενέργειες. Το ID επιτρέπει άνοιγμα μετά από page refresh.
Η φόρμα δημιουργεί νέο draft, δεν αλλάζει υπάρχον experiment. API-created multi-dataset
experiments εμφανίζονται πλήρως. Τα persisted results χρησιμοποιούν snapshot identity.

Τα controls κλειδώνουν κατά το request. Catalogue timeout 15s, mutations/read 30s,
abort κατά unmount, χωρίς automatic replay. Με αποτυχία run απαιτείται successful
GET πριν ενεργοποιηθεί ξανά Run. Μη επιβεβαιωμένο save προειδοποιεί ότι μπορεί να
δημιουργήθηκε draft (η νέα αποθήκευση ενδέχεται να διπλασιάσει εγγραφή).
Labels el/en· η αλλαγή γλώσσας διατηρεί state. Δεν υπάρχει edit/delete ή
localStorage. Authentication/ownership παραμένουν εκτός local MVP.

## History — #47

GET `/api/experiments/` επιστρέφει `{results: [...], next_before: number|null}`.
Κάθε summary περιλαμβάνει id/name/status/created_at/updated_at, χωρίς relations ή
measurement blobs. Έως 10 ανά σελίδα, descending ID (creation order, όχι updated time).
Για επόμενη σελίδα στείλε `?before=<next_before>`. Ο cursor δεν απαιτεί να υπάρχει
η αντίστοιχη εγγραφή. Άκυρος/μη θετικός/out-of-range cursor, unknown ή duplicate
query parameters επιστρέφουν 400. Δεν υπάρχει total count ή page-size override.

Το UI δείχνει history, previous/next, refresh στην πρώτη σελίδα και Open κάθε row
μέσω GET detail. Οι επιτυχημένες save/run ενέργειες ανανεώνουν την πρώτη σελίδα.
Το history refresh δεν αλλάζει το ανοιχτό detail ή τη φόρμα. Request timeout 15s,
abort/stale-response suppression κατά navigation/unmount, localized loading/error/retry.
Η γλώσσα δεν επανεκκινεί το request ή την pagination. Άνοιγμα row δεν εκτελεί experiment.
Νέες εισαγωγές δεν μετακινούν τα επόμενα pages· refresh/previous διαβάζουν την τρέχουσα
βάση, χωρίς snapshot isolation. Το local single-user scope δεν παρέχει ownership.


## Persisted comparisons (#62)

Comparison response προσθέτει save_token μόνο για πλήρη measured batches. POST `/api/benchmarks/sorting/compare/save/` δέχεται name/token, επαληθεύει server signature (1 ώρα), και αποθηκεύει υπάρχουσες μετρήσεις σε Experiment/ExperimentResult χωρίς rerun. Δεν δέχεται client timings. Snapshot marker comparison επιτρέπει reopen με το κοινό chart από το υπάρχον history/ID. Catalogue identity αποτυπώνεται κατά το save· αν λείπει απορρίπτεται. Έως 5 ήδη εκτελεσμένα results, ενώ draft execution παραμένει max 4 pairs. Χωρίς migration. Token replay μπορεί να δημιουργήσει δεύτερο saved copy· σε timeout ελέγχουμε history πριν retry. Tests: signature/expiry/tamper, persistence/history/immutable snapshots και frontend reconstruction.

## Pathfinding snapshots (#94)

Το κοινό Experiment αποκτά family (sorting default / pathfinding) και nullable input_snapshot. Η migration 0005 κρατά όλα τα παλιά records ως sorting, χωρίς αλλαγή των sorting create/run/save endpoints. ExperimentResult επαναχρησιμοποιείται για immutable identity/measurement JSON snapshots χωρίς catalogue FK. Τα κοινά GET list/detail επιστρέφουν και τις δύο families. Το list παραμένει bounded (10 summaries, μία query) και δεν φορτώνει τα μεγάλα snapshots.

POST /api/experiments/pathfinding/ δέχεται name, input και results. Το input έχει rows, cols, start/end row-major IDs, walls boolean[] και costs number[] (και τα δύο ακριβώς rows×cols). Όριο 10.000 cells, έγκυρα walkable endpoints και finite non-negative costs έως MAX_SAFE_INTEGER/cells. Το results περιέχει 1–4 μοναδικούς BFS/DFS/Dijkstra/A* με status completed, found, executionTimeMs, visitedNodeCount, pathLength, pathCost, visited και path. Unknown fields, invalid numbers, duplicate IDs, μη cardinal paths και ασύμφωνα metrics απορρίπτονται με 400 πριν από εγγραφή. No-path έχει empty path και null length/cost, start=end έχει length/cost 0. Αποθηκεύονται μόνο ολοκληρωμένα runs, όχι runner errors ή μερικά comparisons.

201 επιστρέφει το κοινό experiment detail. Το input_snapshot περιλαμβάνει version=1, source=browser, cardinal movement και enter-cell-exclude-start cost rule, grid και ordered algorithms. Τα results έχουν ανεξάρτητα name/algorithm/language/version snapshots. Experiment και results γράφονται atomically· storage failure κάνει rollback. Δεν υπάρχουν edit/delete ή rerun για pathfinding records. Το frontend φωτογραφίζει input/results στην εκτέλεση, όχι στο μεταγενέστερο Save. Grid edits/reset/algorithm change ακυρώνουν το unsaved snapshot, ενώ animation δεν μεταβάλλει τις μετρήσεις.

Οι browser measurements είναι client-reported. Ο server ελέγχει shape/όρια και structural consistency, όχι timings, shortest-path optimality ή πραγματική εξάντληση της αναζήτησης σε no-path. Δεν επανεκτελεί algorithms και δεν υπογράφει αυτές τις μετρήσεις όπως το server sorting comparison. Cost consistency χρησιμοποιεί tolerance 1e-12 για floating-point sums. Το snapshot διατηρεί τα inputs και τα καταγεγραμμένα outputs, χωρίς εγγύηση ίδιων χρόνων ή code/environment replay.

Μετά από refresh, κοινό history → Άνοιγμα ή ID εμφανίζει metrics, grid με costs/walls/endpoints και paths χωρίς νέο run. Ελληνικά/αγγλικά labels διακρίνουν την πηγή browser. Αποτυχία/timeout save προτρέπει έλεγχο history πριν από retry, επειδή μπορεί να έχει ήδη γίνει εγγραφή. Δεν υπάρχει idempotency key.
