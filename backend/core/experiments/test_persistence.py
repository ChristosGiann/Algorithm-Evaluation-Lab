from unittest.mock import patch
from django.db import IntegrityError
from django.test import TestCase
from core.models import Experiment, ExperimentResult, DatasetDefinition
from .persistence import store_experiment


class SharedSnapshotStorageTests(TestCase):
    def test_both_families_keep_their_own_measurements_and_independent_values(self):
        for family, measurement in [("sorting", {"timings_ns":[1,2], "correct":False}),
                                    ("pathfinding", {"found":False, "pathLength":None})]:
            with self.subTest(family=family):
                row={"implementation_snapshot":{"algorithm":"example"}, "measurement":measurement}
                record=store_experiment(name="Stored",family=family,results=[row],
                    status="failed" if family == "sorting" else "completed",
                    execution_error="incorrect_result" if family == "sorting" else "",
                    input_snapshot={"version":1})
                self.assertEqual(record.family,family)
                self.assertEqual(record.results.get().measurement,measurement)
                row["measurement"]["changed"]=True
                row["implementation_snapshot"]["algorithm"]="edited"
                self.assertNotIn("changed",record.results.get().measurement)
                self.assertEqual(record.results.get().implementation_snapshot["algorithm"],"example")
                self.assertEqual(record.input_snapshot,{"version":1})

    def test_result_failure_rolls_back_definition_and_experiment_for_both_families(self):
        for family in ("sorting","pathfinding"):
            with self.subTest(family=family):
                with patch("core.experiments.persistence.ExperimentResult.objects.bulk_create",side_effect=IntegrityError("storage")):
                    with self.assertRaises(IntegrityError):
                        store_experiment(name="Rollback",family=family,
                            results=[{"implementation_snapshot":{},"measurement":{}}],
                            datasets=[{"dataset_type":"random","size":10,"seed":42}] if family == "sorting" else [])
                self.assertEqual(Experiment.objects.count(),0)
                self.assertEqual(ExperimentResult.objects.count(),0)
                self.assertEqual(DatasetDefinition.objects.count(),0)

    def test_unknown_family_unfinished_or_empty_snapshot_is_rejected(self):
        for options in ({"family":"unknown"},{"status":"draft"},{"results":[]}):
            kwargs={"name":"Invalid","family":"sorting","results":[{"implementation_snapshot":{},"measurement":{}}],**options}
            with self.assertRaises(ValueError):
                store_experiment(**kwargs)
        self.assertFalse(Experiment.objects.exists())
