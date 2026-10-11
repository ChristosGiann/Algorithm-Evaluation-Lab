import copy
from unittest.mock import patch
from django.db import IntegrityError
from django.urls import reverse
from rest_framework.test import APITestCase
from core.models import Experiment, ExperimentResult, Problem


class PathfindingPersistenceTests(APITestCase):
    def payload(self):
        return {"name": "Weighted detour", "input": {
            "rows": 2, "cols": 3, "start": 0, "end": 2,
            "walls": [False] * 6, "costs": [1,5,1,1,1,1],
        }, "results": [{"algorithm": "dijkstra", "status": "completed", "found": True,
            "executionTimeMs": 0.125, "visitedNodeCount": 5, "pathLength": 4, "pathCost": 4,
            "visited": [0,3,4,5,2], "path": [0,3,4,5,2]}]}

    def save(self, payload):
        return self.client.post(reverse("save-pathfinding"), payload, format="json")

    def test_save_list_reopen_without_execution_or_catalogue(self):
        payload = self.payload()
        payload["results"].append({**copy.deepcopy(payload["results"][0]), "algorithm": "astar"})
        with patch("core.experiments.execution.run_sorting_benchmark", side_effect=AssertionError("Must not run")):
            saved = self.save(payload)
            self.assertEqual(saved.status_code, 201, saved.data)
            pk = saved.data["id"]
            self.assertEqual(saved.data["family"], "pathfinding")
            self.assertEqual(saved.data["input_snapshot"]["grid"], payload["input"])
            self.assertEqual(saved.data["input_snapshot"]["algorithms"], ["dijkstra", "astar"])
            self.assertEqual([x["measurement"] for x in saved.data["results"]], payload["results"])
            payload["input"]["costs"][1] = 99
            Problem.objects.all().delete()
            self.assertEqual(self.client.get(reverse("experiment-detail", args=[pk])).data, saved.data)
            history = self.client.get(reverse("experiment-create"))
            self.assertEqual(history.data["results"][0]["family"], "pathfinding")
            self.assertNotIn("input_snapshot", history.data["results"][0])
            self.assertEqual(self.client.post(reverse("experiment-run", args=[pk]), {}, format="json").status_code, 409)
        for method in (self.client.put, self.client.patch, self.client.delete):
            self.assertEqual(method(reverse("experiment-detail", args=[pk]), {}, format="json").status_code, 405)

    def test_no_path_and_zero_length_preserve_null_and_zero(self):
        payload = self.payload()
        payload["input"].update(rows=1, cols=3, walls=[False, True, False], costs=[0, 1, 0])
        payload["results"][0].update(found=False, visited=[0], visitedNodeCount=1, path=[], pathLength=None, pathCost=None, executionTimeMs=0)
        response = self.save(payload)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIsNone(response.data["results"][0]["measurement"]["pathCost"])
        payload["input"]["end"] = 0
        payload["results"][0].update(found=True, path=[0], pathLength=0, pathCost=0)
        response = self.save(payload)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["results"][0]["measurement"]["pathCost"], 0)

    def test_invalid_payloads_create_nothing(self):
        mutations = [
            lambda p: p.update(name=" "), lambda p: p.update(family="sorting"),
            lambda p: p["input"].update(rows=True), lambda p: p["input"].update(rows=10001),
            lambda p: p["input"].update(start=-1), lambda p: p["input"].update(end=6),
            lambda p: p["input"].update(walls=[False]), lambda p: p["input"]["walls"].__setitem__(0, True),
            lambda p: p["input"]["costs"].__setitem__(1, -1), lambda p: p["input"]["costs"].__setitem__(1, True),
            lambda p: p["input"]["costs"].__setitem__(1, 10**300), lambda p: p["input"].update(diagonals=True),
            lambda p: p.update(results=[]), lambda p: p["results"].append(copy.deepcopy(p["results"][0])),
            lambda p: p["results"][0].update(algorithm="unknown"), lambda p: p["results"][0].update(status="error"),
            lambda p: p["results"][0].update(executionTimeMs=-1), lambda p: p["results"][0].update(executionTimeMs="1"),
            lambda p: p["results"][0].update(visitedNodeCount=4), lambda p: p["results"][0].update(pathLength=True),
            lambda p: p["results"][0].update(pathCost=6), lambda p: p["results"][0].update(path=[0,2], pathLength=1),
            lambda p: p["results"][0].update(visited=[0,3,3,5,2]), lambda p: p["results"][0].update(found=False),
        ]
        for mutate in mutations:
            payload = self.payload()
            mutate(payload)
            with self.subTest(payload=payload):
                self.assertEqual(self.save(payload).status_code, 400)
                self.assertEqual(Experiment.objects.count(), 0)
                self.assertEqual(ExperimentResult.objects.count(), 0)

    def test_storage_failure_rolls_back(self):
        with patch("core.experiments.persistence.ExperimentResult.objects.bulk_create", side_effect=IntegrityError("storage")):
            with self.assertRaises(IntegrityError):
                self.save(self.payload())
        self.assertFalse(Experiment.objects.exists())
        self.assertFalse(ExperimentResult.objects.exists())

    def test_sorting_default_and_server_owned_family(self):
        legacy = Experiment.objects.create(name="Existing draft")
        self.assertEqual(legacy.family, "sorting")
        self.assertIsNone(legacy.input_snapshot)
        payload = {"name":"Cannot inject", "family":"pathfinding", "input_snapshot":{}, "implementation_ids":[], "datasets":[]}
        self.assertEqual(self.client.post(reverse("experiment-create"), payload, format="json").status_code, 400)
