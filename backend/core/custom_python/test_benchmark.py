from unittest.mock import patch
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIClient
from core.benchmarks.runner import benchmark_dataset
from .benchmark import measure_custom

class CustomBenchmarkTests(SimpleTestCase):
    def test_success_return_and_in_place_fresh_copies(self):
        dataset = benchmark_dataset(5, dataset_type="reversed")
        original = list(dataset.values)
        for source in ("def solve(values):\n    return sorted(values)",
                       f"def solve(values):\n    assert values == {original!r}\n    values.sort()"):
            result = measure_custom(source, dataset)
            self.assertEqual(result["status"], "completed", result)
            self.assertTrue(result["measurement"]["correct"])
            self.assertEqual(len(result["measurement"]["timings_ns"]), 10)
            self.assertIn("stddev_ns", result["measurement"])
        self.assertEqual(list(dataset.values), original)

    def test_incorrect_exception_and_timeout(self):
        dataset = benchmark_dataset(5, dataset_type="reversed")
        wrong = measure_custom("def solve(values):\n    return []", dataset)
        self.assertFalse(wrong["measurement"]["correct"])
        for source, expected in [("def solve(values):\n    raise ValueError()", "error"),
                                 ("def solve(values):\n    while True: pass", "timeout")]:
            result = measure_custom(source, dataset)
            self.assertEqual(result["status"], expected, result)
            self.assertNotIn("measurement", result)

    def test_invalid_rejected_without_process(self):
        with patch("core.custom_python.benchmark.subprocess.run") as run:
            for source in ("def broken(", "def other(values): pass", "import os\ndef solve(values): pass", "def solve(values): return values.__class__"):
                self.assertEqual(measure_custom(source, benchmark_dataset(2))["error"], "validation_error")
            run.assert_not_called()

    @override_settings(DEBUG=True, ENABLE_TRUSTED_CUSTOM_EXECUTION=True)
    def test_endpoint_opt_in_origin_loopback_and_no_fallback(self):
        client = APIClient()
        url = "/api/benchmarks/sorting/custom/"
        data = {"source":"def solve(values): return sorted(values)","trusted":True,"size":5}
        with patch("core.custom_python.benchmark_api.measure_custom") as run:
            for extra in ({}, {"HTTP_ORIGIN":"https://untrusted.example"}, {"HTTP_ORIGIN":"http://127.0.0.1:5173","REMOTE_ADDR":"192.0.2.1"}):
                self.assertEqual(client.post(url,data,format="json",**extra).data["error"],"execution_disabled")
            run.assert_not_called()
        result=client.post(url,data,format="json",HTTP_ORIGIN="http://127.0.0.1:5173")
        self.assertTrue(result.data["measurement"]["correct"])
        with override_settings(ENABLE_TRUSTED_CUSTOM_EXECUTION=False):
            self.assertEqual(client.post(url,data,format="json",HTTP_ORIGIN="http://127.0.0.1:5173").data["error"],"execution_disabled")

    @override_settings(PRODUCTION=True, DEBUG=True, ENABLE_TRUSTED_CUSTOM_EXECUTION=True)
    def test_public_denies_direct_and_comparison_even_if_local_flags_are_forced(self):
        client=APIClient()
        with patch("core.custom_python.benchmark.subprocess.run") as worker:
            for path, payload in [
                ("/api/benchmarks/sorting/custom/", {"source":"def solve(values): return sorted(values)","trusted":True,"size":5}),
                ("/api/benchmarks/sorting/compare/", {"custom_source":"def solve(values): return sorted(values)","trusted":True,"size":5,"algorithms":["bubble-sort"]}),
            ]:
                response=client.post(path,payload,format="json",HTTP_ORIGIN="http://127.0.0.1:5173",REMOTE_ADDR="127.0.0.1")
                self.assertIn("execution_disabled",str(response.data))
                custom = response.data["results"][-1] if "results" in response.data else response.data
                self.assertNotIn("measurement", custom)
                if "results" in response.data:
                    self.assertTrue(response.data["results"][0]["measurement"]["correct"])
            worker.assert_not_called()
