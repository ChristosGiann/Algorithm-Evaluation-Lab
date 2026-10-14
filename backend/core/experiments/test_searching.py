import copy
from unittest.mock import patch
from django.db import IntegrityError
from django.urls import reverse
from rest_framework.test import APITestCase
from core.models import Experiment, ExperimentResult
from .searching import validate_snapshot


class SearchingPersistenceTests(APITestCase):
    def payload(self):
        return {"name": "Searching snapshot", "input": {"values": [1, 3, 5], "target": 3}, "results": [
            {"algorithm": "linear", "status": "completed", "found": True, "correct": True, "index": 1,
             "executionTimeMs": 0.125, "probeCount": 2, "comparisons": 2, "probes": [0, 1]}]}

    def save(self, payload):
        return self.client.post(reverse("save-searching"), payload, format="json")

    def test_save_history_reopen_is_read_only_without_execution(self):
        payload = self.payload()
        payload["results"].append({**copy.deepcopy(payload["results"][0]), "algorithm": "binary"})
        with patch("core.experiments.execution.run_sorting_benchmark", side_effect=AssertionError("Must not execute")):
            saved = self.save(payload)
            self.assertEqual(saved.status_code, 201, saved.data)
            self.assertEqual(saved.data["family"], "searching")
            self.assertEqual(saved.data["status"], "completed")
            self.assertEqual(saved.data["input_snapshot"], {"version": 1, "source": "browser", "input": payload["input"], "algorithms": ["linear", "binary"]})
            self.assertEqual([r["measurement"] for r in saved.data["results"]], payload["results"])
            pk = saved.data["id"]
            payload["input"]["values"][0] = 99
            payload["results"][0]["probes"].clear()
            self.assertEqual(self.client.get(reverse("experiment-detail", args=[pk])).data, saved.data)
            history = self.client.get(reverse("experiment-create")).data["results"][0]
            self.assertEqual(history["family"], "searching")
            self.assertNotIn("input_snapshot", history)
            self.assertEqual(self.client.post(reverse("experiment-run", args=[pk]), {}, format="json").status_code, 409)
        for method in (self.client.put, self.client.patch, self.client.delete):
            self.assertEqual(method(reverse("experiment-detail", args=[pk]), {}, format="json").status_code, 405)

    def test_empty_absent_zero_index_and_incorrect_results(self):
        for values, target, index, correct in [([], 1, None, True), ([1], 2, None, True), ([1], 1, 0, True), ([1], 1, None, False), ([1], 2, 0, False)]:
            with self.subTest(values=values, target=target, index=index):
                payload = self.payload()
                probes = [] if index is None else [index]
                payload["input"] = {"values": values, "target": target}
                payload["results"][0].update(index=index, found=index is not None, correct=correct, probes=probes, probeCount=len(probes), comparisons=len(probes), executionTimeMs=0)
                saved = self.save(payload)
                self.assertEqual(saved.status_code, 201, saved.data)
                self.assertEqual(saved.data["status"], "completed" if correct else "failed")
                self.assertEqual(saved.data["results"][0]["measurement"], payload["results"][0])

    def test_unsorted_mixed_and_all_error_rows_keep_no_fabricated_metrics(self):
        payload = self.payload()
        payload["input"]["values"] = [5, 3, 1]
        payload["results"] += [{"algorithm": a, "status": "error", "error": "requires_sorted_input"} for a in ("binary", "jump", "exponential")]
        saved = self.save(payload)
        self.assertEqual(saved.status_code, 201, saved.data)
        self.assertEqual(saved.data["status"], "failed")
        self.assertEqual([r["measurement"] for r in saved.data["results"]], payload["results"])
        for error in ("runner_error", "invalid_clock", "invalid_result"):
            payload = self.payload()
            payload["results"] = [{"algorithm": "linear", "status": "error", "error": error}]
            saved = self.save(payload)
            self.assertEqual(saved.status_code, 201, saved.data)
            self.assertEqual(saved.data["status"], "failed")

    def test_invalid_payloads_are_atomic(self):
        mutations = [
            lambda p: p.update(name=" "), lambda p: p.update(family="searching"),
            lambda p: p["input"].update(values=[True]), lambda p: p["input"].update(values=[1]*10001),
            lambda p: p["input"].update(target="3"), lambda p: p["input"].update(target=10**400),
            lambda p: p["input"].update(extra=1), lambda p: p.update(results=[]),
            lambda p: p["results"].append(copy.deepcopy(p["results"][0])),
            lambda p: p["results"][0].update(algorithm=[]), lambda p: p["results"][0].update(algorithm="unknown"),
            lambda p: p["results"][0].update(index=True), lambda p: p["results"][0].update(index=3),
            lambda p: p["results"][0].update(index=2), lambda p: p["results"][0].update(probes=[True, 1]),
            lambda p: p["results"][0].update(probes=[0]*100001), lambda p: p["results"][0].update(probeCount=1),
            lambda p: p["results"][0].update(comparisons=1), lambda p: p["results"][0].update(comparisons=2**53),
            lambda p: p["results"][0].update(found=False), lambda p: p["results"][0].update(correct=False),
            lambda p: p["results"][0].update(executionTimeMs=-1), lambda p: p["results"][0].update(executionTimeMs=True),
            lambda p: p["results"][0].update(status="running"), lambda p: p["results"][0].update(error="runner_error"),
            lambda p: p.update(results=[{"algorithm":"linear", "status":"error", "error":"requires_sorted_input"}]),
            lambda p: p.update(results=[{"algorithm":"binary", "status":"error", "error":"requires_sorted_input"}]),
            lambda p: (p["input"].update(values=[5,3,1]), p["results"][0].update(algorithm="binary")),
        ]
        for mutate in mutations:
            payload = self.payload()
            mutate(payload)
            with self.subTest(mutation=mutations.index(mutate)):
                self.assertEqual(self.save(payload).status_code, 400)
                self.assertFalse(Experiment.objects.exists())
                self.assertFalse(ExperimentResult.objects.exists())
        for value in (float("nan"), float("inf"), float("-inf")):
            payload = self.payload()
            payload["input"]["target"] = value
            from rest_framework.exceptions import ValidationError
            with self.assertRaises(ValidationError):
                validate_snapshot(payload)

    def test_storage_failure_rolls_back(self):
        with patch("core.experiments.persistence.ExperimentResult.objects.bulk_create", side_effect=IntegrityError("storage")):
            with self.assertRaises(IntegrityError):
                self.save(self.payload())
        self.assertFalse(Experiment.objects.exists())
        self.assertFalse(ExperimentResult.objects.exists())
