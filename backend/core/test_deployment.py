import os
from pathlib import Path
import runpy
from unittest.mock import patch
from django.test import SimpleTestCase


class DeploymentConfigTests(SimpleTestCase):
    def test_provider_port_and_limits(self):
        config=Path(__file__).resolve().parents[1] / "gunicorn.conf.py"
        with patch.dict(os.environ,{"PORT":"12345"}):
            result=runpy.run_path(str(config))
        self.assertEqual(result["bind"],"0.0.0.0:12345")
        self.assertEqual(result["workers"],1)
        for port in ["", "0", "65536", "abc", "1;echo unsafe"]:
            with patch.dict(os.environ,{"PORT":port}),self.assertRaises(ValueError):
                runpy.run_path(str(config))
