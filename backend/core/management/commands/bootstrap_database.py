"""Serialize deployment migrations and idempotent seed on a direct PG session."""
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

LOCK_ID = 1747147


class Command(BaseCommand):
    help = "Apply migrations and seed sorting data; PostgreSQL direct connection only."
    requires_system_checks = []

    def handle(self, *args, **options):
        if connection.vendor != "postgresql":
            raise CommandError("Bootstrap requires PostgreSQL; use normal migrate/seed commands locally.")
        stage = "database connection"
        locked = False
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_try_advisory_lock(%s)", [LOCK_ID])
                locked = cursor.fetchone()[0]
            if not locked:
                raise CommandError("Another database bootstrap is active; retry after it finishes.")
            stage = "migrations"
            call_command("migrate", interactive=False, stdout=self.stdout, verbosity=options["verbosity"])
            stage = "seed"
            call_command("seed_sorting_algorithms", stdout=self.stdout, verbosity=options["verbosity"])
            stage = "migration verification"
            call_command("migrate", check_unapplied=True, interactive=False, stdout=self.stdout, verbosity=0)
        except CommandError:
            raise
        except Exception:
            # Driver exceptions can include connection details. Report stage, not DSN.
            raise CommandError(f"Database bootstrap failed during {stage}; service startup stopped.") from None
        finally:
            if locked:
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("SELECT pg_advisory_unlock(%s)", [LOCK_ID])
                finally:
                    connection.close()
        self.stdout.write(self.style.SUCCESS("Database bootstrap completed."))
