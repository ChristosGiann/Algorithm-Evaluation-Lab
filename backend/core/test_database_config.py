from pathlib import Path
from django.test import SimpleTestCase
from django.core.exceptions import ImproperlyConfigured
from config.database import database_config


class DatabaseConfigTests(SimpleTestCase):
    def test_local_fallback(self):
        self.assertEqual(database_config(Path("/local"), None), {"ENGINE": "django.db.backends.sqlite3", "NAME": Path("/local/db.sqlite3")})

    def test_postgres_url_and_neon_options(self):
        value = database_config(Path("/local"), "postgresql://user:p%40ss@db.example.test:5432/lab?sslmode=require&channel_binding=require")
        self.assertEqual(value["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual(value["PASSWORD"], "p@ss")
        self.assertEqual(value["OPTIONS"]["sslmode"], "require")
        self.assertEqual(value["OPTIONS"]["channel_binding"], "require")
        self.assertTrue(value["DISABLE_SERVER_SIDE_CURSORS"])
        self.assertEqual(value["CONN_MAX_AGE"], 0)

    def test_invalid_urls_fail_without_echoing_credentials(self):
        for url in ["mysql://user:private@host/db", "postgres://user:private@/db", "postgres://user:private@host", "not-a-url"]:
            with self.assertRaises(ImproperlyConfigured) as raised:
                database_config(Path("/local"), url)
            self.assertNotIn("private", str(raised.exception))
