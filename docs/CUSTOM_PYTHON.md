# Custom Python validation (#22)

The editor validates Python source through `POST /api/implementations/validate-python/`.
This performs static checks only: it never imports or executes submitted code.
Source and validation results are not persisted or registered as implementations.
Custom code is not connected to experiments or benchmarks.

## Contract

- Maximum 32,768 UTF-8 bytes, enforced in the UI, API validator and CLI.
- Exactly one top-level synchronous `def solve(values)` declaration.
- Positional-only `values` is allowed. Extra/default parameters, decorators,
  async functions and generator implementations are rejected.
- Expected behavior: return a sorted integer list, or sort the input list in
  place and return `None`. Static validation cannot prove this behavior.
- Syntax checks use Python AST parsing and compilation without execution.
- API errors have stable codes, Greek messages and optional 1-based line/column.
  The UI renders codes in the selected Greek/English language; CLI messages
  remain Greek. See [Language](LANGUAGE.md).

For example:

```python
def solve(values):
    return sorted(values)
```

The editor preserves source after a failed request. Editing clears the previous
result; submission locks the editor until the request settles. Requests time out
after 15 seconds and abort on unmount.

## Explicit local execution

From the repository root, with the backend environment activated:

```powershell
python backend\manage.py validate_custom_python .\example.py
python backend\manage.py validate_custom_python .\example.py --run-local
```

The first command only validates. The second explicitly executes developer-owned
code in a separate Python process, after static validation. No HTTP parameter can
enable execution. Output is JSON; exit status is 0 for success and 1 for failure.

The worker checks empty, singleton, unsorted, duplicate/negative, sorted and
reversed lists. It checks actual runtime signature and integer-list results.
Import-time and function-call exceptions are reported as `runtime_error`;
wrong output is `incorrect_result`. A 2-second timeout includes code loading and
all smoke cases. On timeout the direct child is killed and reaped.
Child stdout/stderr are discarded so prints do not corrupt the result protocol.

## Limits

**This is not a sandbox and is not suitable for public execution of untrusted
code.** The child retains the local user's filesystem, network and OS privileges.
Isolated Python flags, a temporary working directory and a reduced environment
are hygiene measures, not a security boundary. There are no memory/CPU quotas,
and timeout handling does not guarantee termination of spawned descendants.
Use `--run-local` only with code you own and trust.

Passing static validation proves only the checked declaration and syntax; later
rebinding or top-level side effects are possible. Passing the finite smoke cases
does not prove general correctness. Hostile code can tamper with the worker or
exit status. Public execution requires a separately designed and hardened
sandbox (for example Docker with resource, filesystem and network restrictions).
No such sandbox is included here.

## Verification

On 2026-09-25, all 60 backend tests passed, including 16 new tests covering
static validation, strict API requests, real subprocess results, real infinite
loops at import and call time, and CLI opt-in/error behavior. Existing four
frontend tests, lint, production build, Django checks and migration dry-run passed.
Browser checks covered valid source, syntax error with position, missing solve
and a disabled submit button above the byte limit; no browser console errors
were observed. Direct CLI checks also confirmed valid execution (exit 0) and an
infinite-loop timeout (exit 1 with `timeout`).
See [Testing](TESTING.md) for remaining verification limits.


## Trusted custom benchmark (#67)

POST `/api/benchmarks/sorting/custom/` με source, trusted:true, size, seed, dataset_type. Disabled by default: απαιτούνται DEBUG, `ENABLE_TRUSTED_CUSTOM_EXECUTION=true`, loopback REMOTE_ADDR και επιτρεπόμενο frontend Origin. Το UI ζητά acknowledgement για δικό σου trusted code. Για προσωρινή τοπική ενεργοποίηση PowerShell: `$env:ENABLE_TRUSTED_CUSTOM_EXECUTION='true'` και restart backend στο 127.0.0.1. Μην ενεργοποιείται σε public/proxied server. Δεν αλλάζει αυτόματα το .env.

Νέος worker, ξεχωριστός από το παλιό CLI smoke: Python -I -S, προσωρινό cwd, reduced env, stdout/stderr discarded, 2 s wall timeout, ένα custom process ανά server process, input≤1000/source≤32768 UTF-8 bytes/output≤16 KiB. Unix επιπλέον 256 MiB address-space/2 s CPU/file-size limits· Windows έχει wall-time/input/output/concurrency limits, όχι OS memory isolation. **Δεν είναι hostile-code sandbox**. Static validation προηγείται· execution subset δέχεται μόνο function definitions χωρίς imports/classes/decorators/defaults/annotations, περιορισμένα built-ins και list/dict methods (core/custom_python/benchmark.py). Δεν υποστηρίζονται packages/network/I/O.

solve(values) επιστρέφει list ή None για in-place. Δέκα fresh copies, μόνο solve timed, correctness μετά κάθε run, ίδιο timing_statistics helper με built-ins. Structured validation/runtime/timeout/busy/unavailable errors, ποτέ fallback. Source/results δεν αποθηκεύονται. Tests: πραγματικά subprocess success/incorrect/exception/timeout/fresh-copy, rejection πριν process, local opt-in gates και bilingual UI acknowledgement. Η παλαιότερη περιγραφή «μόνο CLI execution» αντικαθίσταται από αυτό το opt-in flow.


## Mixed custom/built-in comparison (#68)

Το υπάρχον POST sorting/compare/ δέχεται optional custom_source και trusted:true μαζί με 1–4 distinct built-ins (χωρίς custom παραμένει 2–5). Μία generation, ανεξάρτητες copies σε parent/worker, ίδιο configuration και metrics helper. Το πρώτο selected built-in είναι το ρητό baseline· custom row έχει source_type:custom και algorithm:custom-python. Failure/timeout/disabled/invalid custom δεν ακυρώνουν τις built-in μετρήσεις και δεν δημιουργούν metrics. Το UI προσθέτει προαιρετική built-in επιλογή στη custom φόρμα και επαναχρησιμοποιεί ComparisonResults/table/common scale/relative speed. Mixed results δεν παίρνουν save_token: custom persistence είναι εκτός scope. Process startup δεν χρονομετρείται· ο worker έχει ξεχωριστό process context, επομένως οι χρόνοι δεν αποδεικνύουν γενική ανωτερότητα. Backend tests καλύπτουν same dataset/fresh copies/πραγματικό worker/errors, frontend tests mixed identities/scales/failed rows.


## Local-only execution — #145

Production/Render mode αναγκάζει `ENABLE_TRUSTED_CUSTOM_EXECUTION=False`. Και το shared API execution gate απορρίπτει PRODUCTION ανεξάρτητα από DEBUG/opt-in flags, σε direct custom benchmark και custom comparison. Structured `execution_disabled` χωρίς worker spawn. Το UI εξηγεί public-demo περιορισμό/local clone και κλειδώνει τα execution controls μετά από denial (refresh μετά από αλλαγή server configuration).

Τοπικά: clone, `DJANGO_ENV=development`, `DJANGO_DEBUG=true`, explicit `ENABLE_TRUSTED_CUSTOM_EXECUTION=true`, backend σε 127.0.0.1 και allowed localhost origin. Μόνο δικός σου trusted code· δεν είναι hostile-code sandbox. Static validation και built-in benchmarks παραμένουν διαθέσιμα.
