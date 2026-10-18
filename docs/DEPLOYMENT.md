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
