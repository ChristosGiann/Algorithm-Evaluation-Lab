# Public deployment preparation

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

Δεν έχει επιβεβαιωθεί hosted Render/Neon deployment. Αυτή η ενότητα περιγράφει την υποστήριξη του repository, όχι ενεργή online υπηρεσία.


## Production settings — #144

`DJANGO_ENV=production` (ή Render `RENDER=true`) ενεργοποιεί strict configuration. Απαιτούνται generated secret ≥50 χαρακτήρων, `DJANGO_DEBUG=false`, PostgreSQL `DATABASE_URL`, comma-separated `DJANGO_ALLOWED_HOSTS` χωρίς wildcard/scheme/port και HTTPS `DJANGO_CORS_ALLOWED_ORIGINS`. Προαιρετικά explicit HTTPS `DJANGO_CSRF_TRUSTED_ORIGINS` για cookie-authenticated cross-origin flows. CORS δεν είναι authentication.

HTTPS redirect, secure cookies και HSTS ενεργοποιούνται σε production. Forwarded-protocol trust ενεργοποιείται μόνο στο Render· άλλος reverse proxy απαιτεί ξεχωριστή ελεγμένη ρύθμιση. Localhost παραμένει HTTP-compatible. `python backend/manage.py check --deploy --fail-level WARNING` ελέγχεται με production configuration σε subprocess test χωρίς πραγματικά credentials.

Πηγή: [Django deployment checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/).


## Local-only execution — #145

Production/Render mode αναγκάζει `ENABLE_TRUSTED_CUSTOM_EXECUTION=False`. Και το shared API execution gate απορρίπτει PRODUCTION ανεξάρτητα από DEBUG/opt-in flags, σε direct custom benchmark και custom comparison. Structured `execution_disabled` χωρίς worker spawn. Το UI εξηγεί public-demo περιορισμό/local clone και κλειδώνει τα execution controls μετά από denial (refresh μετά από αλλαγή server configuration).

Τοπικά: clone, `DJANGO_ENV=development`, `DJANGO_DEBUG=true`, explicit `ENABLE_TRUSTED_CUSTOM_EXECUTION=true`, backend σε 127.0.0.1 και allowed localhost origin. Μόνο δικός σου trusted code· δεν είναι hostile-code sandbox. Static validation και built-in benchmarks παραμένουν διαθέσιμα.


## Render backend configuration — #146

Το `render.yaml` ορίζει free Python Web Service στο Frankfurt, branch **main**, auto-deploy μόνο μετά από επιτυχημένα checks, health path `/api/health/`. Η main ενημερώνεται μόνο με ρητή εντολή. Μέχρι να προωθηθούν οι αλλαγές και να δημιουργηθεί service, αυτό είναι configuration, όχι ενεργό deployment.

Build: `bash scripts/build-backend.sh` (dependencies, deploy checks, collectstatic). Start: `bash scripts/start-backend.sh` (production preflight, migration consistency, Gunicorn WSGI). Provider `PORT` ελέγχεται και γίνεται bind στο `0.0.0.0`. Το local development συνεχίζει με Django runserver· Gunicorn εκτελείται σε Linux. WhiteNoise σερβίρει Django admin/static assets.

Στο Render dashboard εισάγονται τα sync:false env values: Neon DATABASE_URL, explicit backend hostname, HTTPS frontend origins και generated DJANGO_SECRET_KEY τουλάχιστον 50 χαρακτήρων (π.χ. `secrets.token_urlsafe(64)` τοπικά). Δεν μπαίνουν secrets σε Git ή chat. CSRF origins μπορούν να μείνουν κενά αν δεν χρησιμοποιείται cross-origin cookie authentication. Δεν απαιτείται αγορά paid plan.

Μετά τη δημιουργία ελέγχουμε public `/api/health/`, static assets, startup logs και auto-deploy από main. Το frontend build παίρνει `VITE_API_BASE_URL=https://<backend-host>` χωρίς trailing slash. Frontend hosting ανήκει στο #148.

Το CI εκκινεί το ίδιο start script με Gunicorn και production configuration σε disposable PostgreSQL και ελέγχει πραγματικό HTTP health/static response. Αυτό **δεν αποδεικνύει** Render provisioning, routing ή auto-deploy. Το #146 μένει ανοιχτό μέχρι τη hosted επαλήθευση.

Πηγές: [Render Django](https://render.com/docs/deploy-django), [Blueprint reference](https://render.com/docs/blueprint-spec).
