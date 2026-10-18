from contextlib import contextmanager
from io import StringIO
import importlib.util
from pathlib import Path
from unittest.mock import MagicMock, patch
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import SimpleTestCase, TestCase
from core.models import Algorithm, AlgorithmImplementation, Problem, Experiment


class BootstrapOrderingTests(SimpleTestCase):
    @contextmanager
    def fake_connection(self, acquired=True):
        connection = MagicMock(vendor="postgresql")
        connection.cursor.return_value.__enter__.return_value.fetchone.return_value = [acquired]
        with patch("core.management.commands.bootstrap_database.connection",connection):
            yield connection

    def test_migrate_before_seed_and_recheck_then_unlock(self):
        with self.fake_connection() as connection, patch("core.management.commands.bootstrap_database.call_command") as commands:
            call_command("bootstrap_database",stdout=StringIO())
            self.assertEqual([c.args[0] for c in commands.call_args_list],["migrate","seed_sorting_algorithms","migrate"])
            self.assertTrue(commands.call_args_list[-1].kwargs["check_unapplied"])
            connection.close.assert_called_once()
            self.assertIn("pg_advisory_unlock",connection.cursor.return_value.__enter__.return_value.execute.call_args.args[0])

    def test_failure_stops_pipeline_and_releases_lock(self):
        for stage in [0,1]:
            with self.subTest(stage=stage), self.fake_connection() as connection, patch("core.management.commands.bootstrap_database.call_command",side_effect=[None]*stage+[RuntimeError("private-connection-detail")]) as commands:
                with self.assertRaises(CommandError) as raised:
                    call_command("bootstrap_database",stdout=StringIO())
                self.assertNotIn("private-connection-detail",str(raised.exception))
                self.assertEqual(commands.call_count,stage+1)
                connection.close.assert_called_once()

    def test_busy_database_does_not_migrate_or_unlock_other_session(self):
        with self.fake_connection(False) as connection, patch("core.management.commands.bootstrap_database.call_command") as commands:
            with self.assertRaisesMessage(CommandError,"Another database bootstrap"):
                call_command("bootstrap_database",stdout=StringIO())
            commands.assert_not_called()
            connection.close.assert_not_called()

    def test_direct_url_selection_does_not_modify_runtime_environment(self):
        path=Path(__file__).resolve().parents[2]/"scripts/bootstrap_database.py"
        spec=importlib.util.spec_from_file_location("bootstrap_script",path)
        module=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        env={"DATABASE_URL":"postgresql://u:p@ep-pooler.example/db","MIGRATION_DATABASE_URL":"postgresql://u:p@ep.example/db?sslmode=require"}
        selected=module.migration_environment(env)
        self.assertEqual(selected["DATABASE_URL"],env["MIGRATION_DATABASE_URL"])
        self.assertIn("pooler",env["DATABASE_URL"])
        for value in ["", "sqlite:///local", "postgresql://u:secret@ep-pooler.example/db"]:
            with self.assertRaises(ValueError) as raised:
                module.migration_environment({"MIGRATION_DATABASE_URL":value})
            self.assertNotIn("secret",str(raised.exception))


class BootstrapSeedTests(TestCase):
    def test_repeated_seed_preserves_ids_and_existing_history(self):
        experiment=Experiment.objects.create(name="existing history")
        call_command("seed_sorting_algorithms",stdout=StringIO())
        before=list(AlgorithmImplementation.objects.order_by("pk").values_list("pk","algorithm_id"))
        call_command("seed_sorting_algorithms",stdout=StringIO())
        self.assertEqual(Problem.objects.filter(slug="sorting").count(),1)
        self.assertEqual(Algorithm.objects.count(),5)
        self.assertEqual(AlgorithmImplementation.objects.count(),5)
        self.assertEqual(list(AlgorithmImplementation.objects.order_by("pk").values_list("pk","algorithm_id")),before)
        self.assertTrue(Experiment.objects.filter(pk=experiment.pk,name="existing history").exists())
