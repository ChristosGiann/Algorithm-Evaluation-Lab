# Public deployment


## Ενεργό public demo — 2026-10-25

- Frontend: [Algorithm Evaluation Lab](https://algorithm-evaluation-lab.onrender.com).
- Backend: [Django API](https://algorithm-evaluation-lab-api.onrender.com/api/health/).
- Repository: `ChristosGiann/Algorithm-Evaluation-Lab`, deployment branch `main`.

```text
React / Vite — Render Static Site
    ↓ VITE_API_BASE_URL
Django / DRF / Gunicorn — Render Web Service (Frankfurt)
    ↓ DATABASE_URL (pooled)
Neon PostgreSQL (AWS eu-central-1 / Frankfurt)
```

Χρησιμοποιούνται free plans. Το Render backend κάνει spin down όταν δεν χρησιμοποιείται·
η πρώτη κλήση μπορεί να καθυστερήσει 50 δευτερόλεπτα ή περισσότερο. Αν το UI δείξει προσωρινά
μη διαθέσιμο backend, περίμενε να ολοκληρωθεί το cold start και επανάλαβε τη δοκιμή.
Δεν πρόκειται για εγγύηση χρόνων απόκρισης ή benchmark performance.

Το Neon project είναι `Algorithm Evaluation Lab`, branch `production`, database `neondb`.
Το runtime χρησιμοποιεί pooled `DATABASE_URL` (hostname με `-pooler`) και το bootstrap
χρησιμοποιεί direct `MIGRATION_DATABASE_URL` για την ίδια βάση.
Τα πραγματικά connection strings και το `DJANGO_SECRET_KEY` υπάρχουν μόνο στο provider environment,
ποτέ σε Git, docs, issues ή logs.

### Καταγεγραμμένη hosted επαλήθευση

Στις 2026-10-25, το αρχικό deployment του `af0e8db` ολοκληρώθηκε στα δύο Render services.
Το handoff της χειροκίνητης δοκιμής καταγράφει:

- `Database bootstrap completed.`, πέντε seeded implementations και Gunicorn startup.
- Frontend → backend επικοινωνία και Greek UI/hash navigation.
- Quick Sort, Random / size 100 / seed 42 / 10 runs: correct σε όλες τις εκτελέσεις.
- Sorting experiment `#1 Test` (Merge Sort, ίδια δεδομένα): αποθήκευση και reopen μετά από refresh.
- Επιτυχείς αντιπροσωπευτικές εκτελέσεις Pathfinding, Searching και String Search.

Στην επαλήθευση του #150 επιβεβαιώθηκαν επιπλέον με απευθείας public requests:
`GET /api/health/` → 200, catalogue → 200, `GET /api/experiments/1/` → completed με saved results,
και `POST /api/benchmarks/sorting/custom/` → HTTP 200 με
`{"algorithm":"custom-python","source_type":"custom","status":"error","error":"execution_disabled"}`.
Το HTTP 200 εδώ είναι το υπάρχον structured error contract, όχι επιτυχής εκτέλεση κώδικα.

Δεν έχει επαληθευτεί χειροκίνητα hosted persistence για τις άλλες τρεις families.
Το πρώτο deployment μόνο του δεν αποδεικνύει auto-deploy ή repeated bootstrap.
Η promotion αυτού του documentation PR στη main χρησιμοποιείται για τους τελικούς ελέγχους
#146–#148. Τα αποτελέσματα, deployment IDs και merge commits καταγράφονται στα αντίστοιχα
GitHub issues πριν από το κλείσιμο. Το #150 κλείνει αφού επιβεβαιωθεί και το deployment.

## Database configuration — #143

Χωρίς `DATABASE_URL` χρησιμοποιείται η υπάρχουσα local SQLite βάση. Με PostgreSQL URL επιλέγεται PostgreSQL χωρίς αλλαγή κώδικα. Το URL εισάγεται μόνο στο ignored `backend/.env` ή στο provider environment, ποτέ σε Git/PR/logs. Χρησιμοποίησε το connection string που δίνει το Neon με `sslmode=require` και τα πρόσθετα TLS options του provider. Passwords με ειδικούς χαρακτήρες χρειάζονται URL encoding.

Invalid ή non-PostgreSQL URLs αποτυγχάνουν με μήνυμα που δεν εμφανίζει credentials. Persistent connections απενεργοποιούνται και server-side cursors επίσης, για συμβατότητα με transaction pooling.

```powershell
python -m pip install -r backend/requirements.txt
python backend/manage.py migrate --noinput
python backend/manage.py check
```

Το CI διατηρεί SQLite checks και προσθέτει πραγματικό PostgreSQL 17 service: fresh migrations και ολόκληρο backend suite. Τα `input_snapshot` χρησιμοποιούν PostgreSQL `json` αντί `jsonb`, επειδή literal browser strings επιτρέπουν NUL/isolated UTF-16 surrogates. Το API παραμένει ίδιο και διαβάζει ολόκληρα snapshots· δεν υποστηρίζονται JSON query operators σε αυτό το πεδίο. Migration 0008 αλλάζει τον τύπο με διατήρηση δεδομένων.

Πηγές: [dj-database-url](https://pypi.org/project/dj-database-url/), [PostgreSQL JSON Unicode restrictions](https://www.postgresql.org/docs/current/datatype-json.html).

Το hosted Render/Neon deployment είναι ενεργό· η παραπάνω καταγραφή διαχωρίζει τα επιβεβαιωμένα checks από τα release checks που απαιτούν νέο main commit.


## Production settings — #144

`DJANGO_ENV=production` (ή Render `RENDER=true`) ενεργοποιεί strict configuration. Απαιτούνται generated secret ≥50 χαρακτήρων, `DJANGO_DEBUG=false`, PostgreSQL `DATABASE_URL`, comma-separated `DJANGO_ALLOWED_HOSTS` χωρίς wildcard/scheme/port και HTTPS `DJANGO_CORS_ALLOWED_ORIGINS`. Προαιρετικά explicit HTTPS `DJANGO_CSRF_TRUSTED_ORIGINS` για cookie-authenticated cross-origin flows. CORS δεν είναι authentication.

HTTPS redirect, secure cookies και HSTS ενεργοποιούνται σε production. Forwarded-protocol trust ενεργοποιείται μόνο στο Render· άλλος reverse proxy απαιτεί ξεχωριστή ελεγμένη ρύθμιση. Localhost παραμένει HTTP-compatible. `python backend/manage.py check --deploy --fail-level WARNING` ελέγχεται με production configuration σε subprocess test χωρίς πραγματικά credentials.

Πηγή: [Django deployment checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/).


## Local-only execution — #145

Production/Render mode αναγκάζει `ENABLE_TRUSTED_CUSTOM_EXECUTION=False`. Και το shared API execution gate απορρίπτει PRODUCTION ανεξάρτητα από DEBUG/opt-in flags, σε direct custom benchmark και custom comparison. Structured `execution_disabled` χωρίς worker spawn. Το UI εξηγεί public-demo περιορισμό/local clone και κλειδώνει τα execution controls μετά από denial (refresh μετά από αλλαγή server configuration).

Τοπικά: clone, `DJANGO_ENV=development`, `DJANGO_DEBUG=true`, explicit `ENABLE_TRUSTED_CUSTOM_EXECUTION=true`, backend σε 127.0.0.1 και allowed localhost origin. Μόνο δικός σου trusted code· δεν είναι hostile-code sandbox. Static validation και built-in benchmarks παραμένουν διαθέσιμα.


## Render backend configuration — #146

Το `render.yaml` ορίζει free Python Web Service στο Frankfurt, branch **main**, auto-deploy μόνο μετά από επιτυχημένα checks, health path `/api/health/`. Η main ενημερώνεται μόνο με ρητή εντολή. Το service `algorithm-evaluation-lab-api` είναι πλέον ενεργό. Η πραγματική συμπεριφορά auto-deploy ελέγχεται από τα Render deploy events μετά από main promotion, όχι μόνο από το Blueprint.

Build: `bash scripts/build-backend.sh` (dependencies, deploy checks, collectstatic). Start: `bash scripts/start-backend.sh` (production preflight, migration consistency, Gunicorn WSGI). Provider `PORT` ελέγχεται και γίνεται bind στο `0.0.0.0`. Το local development συνεχίζει με Django runserver· Gunicorn εκτελείται σε Linux. WhiteNoise σερβίρει Django admin/static assets.

Στο Render dashboard εισάγονται τα sync:false env values: Neon DATABASE_URL, explicit backend hostname, HTTPS frontend origins και generated DJANGO_SECRET_KEY τουλάχιστον 50 χαρακτήρων (π.χ. `secrets.token_urlsafe(64)` τοπικά). Δεν μπαίνουν secrets σε Git ή chat. CSRF origins μπορούν να μείνουν κενά αν δεν χρησιμοποιείται cross-origin cookie authentication. Δεν απαιτείται αγορά paid plan.

Μετά τη δημιουργία ελέγχουμε public `/api/health/`, static assets, startup logs και auto-deploy από main. Το frontend build παίρνει `VITE_API_BASE_URL=https://<backend-host>` χωρίς trailing slash. Το ενεργό frontend hosting περιγράφεται στο #148 παρακάτω.

Το CI εκκινεί το ίδιο start script με Gunicorn και production configuration σε disposable PostgreSQL και ελέγχει πραγματικό HTTP health/static response. Αυτό **δεν αποδεικνύει** Render provisioning, routing ή auto-deploy. Το #146 μένει ανοιχτό μέχρι τη hosted επαλήθευση.

Πηγές: [Render Django](https://render.com/docs/deploy-django), [Blueprint reference](https://render.com/docs/blueprint-spec).


## Neon migrations and seed bootstrap — #147

Στο Neon δημιουργούμε database/role για το public demo, χωρίς import της προσωπικής SQLite βάσης. Στο Connect panel παίρνουμε δύο URLs για **το ίδιο project/branch/database**:

- `DATABASE_URL`: runtime connection, μπορεί να είναι pooled.
- `MIGRATION_DATABASE_URL`: direct (pooling off) connection για migrations και session advisory lock. Διατηρούμε τα TLS options του Neon. Δεν γράφουμε URLs στο repository/chat/logs.

Τα env vars μπαίνουν στο Render dashboard. Το start script καλεί `python scripts/bootstrap_database.py` πριν από Gunicorn. Το script επιλέγει το direct URL μόνο στο δικό του process, ελέγχει production configuration, αποκτά PostgreSQL advisory lock, εκτελεί `migrate --noinput`, το atomic/idempotent `seed_sorting_algorithms` και verification για unapplied migrations. Ο runtime server συνεχίζει με το αρχικό DATABASE_URL. Το build **δεν** αλλάζει schema.

Η διαδικασία γίνεται σε κάθε start και είναι συμβατή με ένα free-tier service, χωρίς paid pre-deploy hook. Κρατάμε έναν deploy runner. Αν υπάρχει άλλο bootstrap, η εκκίνηση αποτυγχάνει και επαναλαμβάνεται αφού τελειώσει το πρώτο. Δεν χρησιμοποιούμε pooled migration URL· το session lock χρειάζεται direct connection.

### Initial deployment

1. Δημιουργία Neon project/database και καταχώριση των δύο URLs στο provider environment.
2. Καταχώριση strong secret, backend hostname και frontend origins στο Render.
3. Ρητή προώθηση του ελεγμένου dev στη main και δημιουργία/sync του Blueprint.
4. Στα startup logs επιβεβαιώνουμε `Database bootstrap completed.` και έπειτα Gunicorn listening.
5. Public `/api/health/` → 200, `/api/algorithms/` → πέντε sorting algorithms. Επαναλαμβάνουμε deploy και ελέγχουμε ότι δεν δημιουργούνται duplicates. Ελέγχουμε save/history και για τις τέσσερις families.

### Επόμενες migrations και αποτυχίες

Κάθε migration γίνεται commit μαζί με την αλλαγή και ελέγχεται σε disposable PostgreSQL CI πριν τη main. Αν migration ή seed αποτύχει, δεν ξεκινά νέος server. Δεν παρακάμπτουμε με `--fake`, manual SQL ή διαγραφή migration records. Ελέγχουμε την αιτία, διορθώνουμε σε νέο issue/PR και ξανατρέχουμε. Ήδη ολοκληρωμένες migrations παραμένουν εφαρμοσμένες· δεν γίνεται αυτόματο rollback ολόκληρου deployment. Οι PostgreSQL atomic migrations και το atomic seed προστατεύουν τα επιμέρους βήματα. Για μελλοντικές destructive migrations χρειάζεται προηγούμενο backup και συμβατότητα με την προηγούμενη έκδοση.

CI: fresh database bootstrap, repeated bootstrap, seed idempotence/history preservation, failure ordering/lock tests και πραγματικό Gunicorn health/static/catalogue smoke. Τα existing experiment suites τρέχουν σε PostgreSQL. Το fresh hosted bootstrap και το sorting history έχουν επιβεβαιωθεί. Τα #146/#147 κλείνουν μόνο μετά την καταγραφή επιτυχούς automatic redeploy και repeated bootstrap με διατήρηση του experiment #1 και χωρίς duplicate implementations.

Πηγή: [Neon connection strings](https://neon.com/docs/connect/connect-from-any-app).


## Render Static Site — #148

Το ενεργό service `algorithm-evaluation-lab` χρησιμοποιεί:

| Ρύθμιση | Τιμή |
| --- | --- |
| Branch | `main` |
| Root Directory | κενό (repository root) |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Environment | `VITE_API_BASE_URL=https://algorithm-evaluation-lab-api.onrender.com` |

Αυτές είναι οι τρέχουσες dashboard ρυθμίσεις· το `render.yaml` ορίζει μόνο το backend.
Το Vite ενσωματώνει το API URL στο build, άρα αλλαγή του απαιτεί νέο frontend build.
Δεν βάζουμε backend secrets σε `VITE_*` variables. Το backend επιτρέπει ως CORS origin
το `https://algorithm-evaluation-lab.onrender.com` και ως host το
`algorithm-evaluation-lab-api.onrender.com`.
Η εφαρμογή χρησιμοποιεί hash navigation (`#overview`, `#sorting`, `#experiments`),
οπότε δεν απαιτείται SPA rewrite για αυτές τις διαδρομές.

## Release και production smoke checklist — #146–#150

1. Branch από ενημερωμένο `dev`, σχετική τεκμηρίωση, PR προς `dev`, επιτυχημένα CI checks και merge.
2. Με ρητή εντολή, PR `dev → main`· ποτέ direct feature push στη main.
3. Στα Render deploy events και των δύο services επιβεβαίωσε **νέο main commit** και automatic trigger.
   Μην πατήσεις Manual Deploy για να αποδείξεις auto-deploy.
4. Στα backend logs: bootstrap complete, χωρίς duplicate seeds, έπειτα Gunicorn startup/live.
5. Health/catalogue, αμετάβλητα IDs/count των πέντε implementations και το υπάρχον experiment `#1 Test`
   με τα ίδια persisted results. Η απλή εμφάνιση πέντε cards δεν αρκεί ως έλεγχος ιστορικού.
6. Public UI: backend διαθέσιμο, Quick Sort Random/100/42/10 σωστό, navigation και refresh λειτουργούν.
7. Direct Custom Python request απορρίπτεται με `execution_disabled`, χωρίς ενεργοποίηση του feature.
8. Καταχώρισε evidence με PR/merge/deployment references στα issues και κλείσε μόνο τα επαληθευμένα.
   Συγχρόνισε τη main πίσω στο μόνιμο dev και διέγραψε μόνο το temporary branch.

### Trusted Custom Python τοπικά

Ακολούθησε το [README quick start](../README.md#quick-start) και το [Custom Python guide](CUSTOM_PYTHON.md).
Στο ignored `backend/.env` βάλε `DJANGO_ENV=development`, `DJANGO_DEBUG=true`,
`ENABLE_TRUSTED_CUSTOM_EXECUTION=true` και localhost CORS origin.
Τρέξε τον backend μόνο σε `127.0.0.1` και το frontend με το τοπικό `VITE_API_BASE_URL`.
Απαιτείται restart μετά από αλλαγή environment. Εκτέλεσε μόνο δικό σου trusted code:
subprocess/timeout/static validation δεν αποτελούν sandbox. Μην ενεργοποιείς αυτό το workflow
στο public Render service. Built-in benchmarks και static validation παραμένουν ανεξάρτητα διαθέσιμα.
