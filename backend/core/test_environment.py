import os
import subprocess
import sys
from pathlib import Path
from django.test import SimpleTestCase
from django.core.exceptions import ImproperlyConfigured
from config.environment import environment_config


class EnvironmentTests(SimpleTestCase):
    def production(self):
        return {"DJANGO_ENV":"production", "DJANGO_SECRET_KEY":"ci-only-" + "abcdefghijkLMNOPQRST0123456789"*3,
                "DATABASE_URL":"postgresql://test:test@localhost/lab", "DJANGO_ALLOWED_HOSTS":"api.example.test",
                "DJANGO_CORS_ALLOWED_ORIGINS":"https://ui.example.test"}

    def test_local_defaults(self):
        result = environment_config({"DJANGO_SECRET_KEY":"local", "DJANGO_DEBUG":"true"})
        self.assertTrue(result["DEBUG"])
        self.assertFalse(result["SECURE_SSL_REDIRECT"])
        self.assertIn("http://127.0.0.1:5173",result["CORS_ALLOWED_ORIGINS"])

    def test_production_is_explicit_and_strict(self):
        for changes in [{"DJANGO_SECRET_KEY":"replace-with-a-local-secret"}, {"DJANGO_DEBUG":"true"},
                        {"DJANGO_ALLOWED_HOSTS":"*"}, {"DJANGO_ALLOWED_HOSTS":""},
                        {"DJANGO_CORS_ALLOWED_ORIGINS":"http://ui.example.test"},
                        {"DJANGO_CORS_ALLOWED_ORIGINS":"https://ui.example.test/path"},
                        {"DJANGO_CSRF_TRUSTED_ORIGINS":"https://*.example.test"}, {"DATABASE_URL":""}]:
            with self.subTest(changes=changes), self.assertRaises(ImproperlyConfigured):
                environment_config({**self.production(), **changes})
        with self.assertRaises(ImproperlyConfigured):
            environment_config({"RENDER":"true", "DJANGO_SECRET_KEY":"local", "DJANGO_DEBUG":"true"})
        result=environment_config({**self.production(), "RENDER":"true"})
        self.assertFalse(result["DEBUG"])
        self.assertTrue(result["SESSION_COOKIE_SECURE"] and result["CSRF_COOKIE_SECURE"])
        self.assertEqual(result["SECURE_PROXY_SSL_HEADER"],("HTTP_X_FORWARDED_PROTO","https"))

    def test_actual_production_deploy_checks_have_no_warnings(self):
        env={**os.environ, **self.production(), "DJANGO_DEBUG":"false", "PYTHON_DOTENV_DISABLED":"1"}
        result=subprocess.run([sys.executable,"manage.py","check","--deploy","--fail-level","WARNING"],
                              cwd=Path(__file__).resolve().parents[1],env=env,capture_output=True,text=True,timeout=30)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)
