import copy
import json
from unittest.mock import patch
from django.db import IntegrityError
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework.exceptions import ValidationError
from core.models import Experiment, ExperimentResult
from .string_search import validate_snapshot


class StringSearchPersistenceTests(APITestCase):
    def payload(self):
        return {"name": "String search snapshot", "input": {"text": "banana", "pattern": "ana", "mode": "first"}, "results": [
            {"algorithm": "naive", "mode": "first", "status": "completed", "found": True, "correct": True, "index": 1,
             "occurrenceIndexes": [1], "preprocessingTimeMs": 0, "executionTimeMs": 0.125,
             "preprocessingComparisons": 0, "comparisons": 4, "alignments": [0, 1]}]}

    def save(self, payload):
        # Escaped JSON also exercises lone UTF-16 surrogate transport.
        return self.client.post(reverse("save-string-search"), json.dumps(payload), content_type="application/json")

    def test_save_list_reopen_preserves_order_and_never_executes(self):
        payload = self.payload()
        payload["results"].append({"algorithm": "kmp", "mode": "first", "status": "error", "error": "runner_error"})
        with patch("core.experiments.execution.run_sorting_benchmark", side_effect=AssertionError("No rerun")):
            saved = self.save(payload)
            self.assertEqual(saved.status_code, 201, saved.data)
            self.assertEqual(saved.data["family"], "string_search")
            self.assertEqual(saved.data["status"], "failed")
            self.assertEqual(saved.data["input_snapshot"], {"version": 1, "source": "browser", "input": payload["input"], "algorithms": ["naive", "kmp"]})
            self.assertEqual([r["measurement"] for r in saved.data["results"]], payload["results"])
            pk = saved.data["id"]
            payload["input"]["text"] = "edited"
            payload["results"][0]["alignments"].clear()
            self.assertEqual(self.client.get(reverse("experiment-detail", args=[pk])).json(), saved.json())
            history = self.client.get(reverse("experiment-create")).data["results"][0]
            self.assertEqual(history["family"], "string_search")
            self.assertNotIn("input_snapshot", history)
            self.assertEqual(self.client.post(reverse("experiment-run", args=[pk]), {}, format="json").status_code, 409)
        for method in (self.client.put, self.client.patch, self.client.delete):
            self.assertEqual(method(reverse("experiment-detail", args=[pk]), {}, format="json").status_code, 405)

    def test_utf16_empty_absent_and_incorrect_first_match_round_trip(self):
        cases = [("", "", 0, True), ("", "x", None, True), ("abc", "z", None, True),
                 ("banana", "ana", 3, False), ("banana", "ana", None, False),
                 ("😀abc", "a", 2, True), ("😀", "\ude00", 1, True), ("x\ud800z", "\ud800", 1, True),
                 ("e\u0301", "é", None, True), (" a ", " ", 0, True), ("A", "a", None, True)]
        for text, pattern, index, correct in cases:
            with self.subTest(text=repr(text), pattern=repr(pattern)):
                payload = self.payload()
                payload["input"].update(text=text, pattern=pattern)
                payload["results"][0].update(index=index, correct=correct, found=index is not None,
                    occurrenceIndexes=[] if index is None else [index], alignments=[] if index is None else [index], comparisons=0)
                saved = self.save(payload)
                self.assertEqual(saved.status_code, 201, saved.data)
                self.assertEqual(saved.data["status"], "completed" if correct else "failed")
                reopened = self.client.get(reverse("experiment-detail", args=[saved.data["id"]])).json()
                self.assertEqual(reopened["input_snapshot"]["input"], payload["input"])
                self.assertEqual(reopened["results"][0]["measurement"], payload["results"][0])

    def test_error_rows_have_no_fake_metrics(self):
        payload = self.payload()
        for error in ("preprocessing_error", "runner_error", "invalid_result", "invalid_clock"):
            payload["results"] = [{"algorithm": "rabinKarp", "mode": "first", "status": "error", "error": error}]
            saved = self.save(payload)
            self.assertEqual(saved.status_code, 201)
            self.assertEqual(saved.data["status"], "failed")
            self.assertEqual(saved.data["results"][0]["measurement"], payload["results"][0])

    def test_invalid_payloads_write_nothing(self):
        mutations = [
            lambda p: p.update(name=" "), lambda p: p.update(family="string_search"),
            lambda p: p["input"].update(text=1), lambda p: p["input"].update(pattern=[]),
            lambda p: p["input"].update(text="x"*10001), lambda p: p["input"].update(text="😀"*5001),
            lambda p: p["input"].update(pattern="😀"*501), lambda p: p["input"].update(mode="all"),
            lambda p: p["input"].update(extra=1), lambda p: p.update(results=[]),
            lambda p: p["results"].append(copy.deepcopy(p["results"][0])),
            lambda p: p["results"][0].update(algorithm=[]), lambda p: p["results"][0].update(algorithm="unknown"),
            lambda p: p["results"][0].update(mode="all"), lambda p: p["results"][0].update(index=True),
            lambda p: p["results"][0].update(index=4), lambda p: p["results"][0].update(alignments=[0, True]),
            lambda p: p["results"][0].update(alignments=[0]*100001), lambda p: p["results"][0].update(alignments=[]),
            lambda p: p["results"][0].update(occurrenceIndexes=[True]), lambda p: p["results"][0].update(occurrenceIndexes=[]),
            lambda p: p["results"][0].update(comparisons=-1), lambda p: p["results"][0].update(preprocessingComparisons=True),
            lambda p: p["results"][0].update(comparisons=2**53), lambda p: p["results"][0].update(correct=False),
            lambda p: p["results"][0].update(found=False), lambda p: p["results"][0].update(executionTimeMs=-1),
            lambda p: p["results"][0].update(preprocessingTimeMs=True), lambda p: p["results"][0].update(executionTimeMs=10**400),
            lambda p: p["results"][0].update(status="running"), lambda p: p["results"][0].update(error="runner_error"),
            lambda p: p.update(results=[{"algorithm":"naive", "mode":"first", "status":"error", "error":"unknown"}]),
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
            payload["results"][0]["preprocessingTimeMs"] = value
            with self.assertRaises(ValidationError):
                validate_snapshot(payload)

    def test_failure_rolls_back_both_tables(self):
        with patch("core.experiments.persistence.ExperimentResult.objects.bulk_create", side_effect=IntegrityError("storage")):
            with self.assertRaises(IntegrityError):
                self.save(self.payload())
        self.assertFalse(Experiment.objects.exists())
        self.assertFalse(ExperimentResult.objects.exists())
