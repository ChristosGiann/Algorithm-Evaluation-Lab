from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APITestCase
from core.models import Experiment


class ExperimentHistoryTests(APITestCase):
    def test_empty_and_exact_page_boundary(self):
        url = reverse("experiment-create")
        self.assertEqual(self.client.get(url).data, {"results": [], "next_before": None})
        Experiment.objects.bulk_create([Experiment(name=f"Test {index}") for index in range(10)])
        response = self.client.get(url)
        self.assertEqual(len(response.data["results"]), 10)
        self.assertIsNone(response.data["next_before"])

    def test_stable_pages_with_new_insert_and_bounded_summary_query(self):
        records = [Experiment.objects.create(name=f"Test {index}") for index in range(23)]
        url = reverse("experiment-create")
        with self.assertNumQueries(1):
            response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["id"] for row in response.data["results"]], [row.pk for row in records[-10:]][::-1])
        self.assertEqual(set(response.data["results"][0]), {"id", "name", "status", "created_at", "updated_at", "family"})
        cursor = response.data["next_before"]
        new = Experiment.objects.create(name="New while browsing")
        ids = [row["id"] for row in response.data["results"]]
        while cursor is not None:
            response = self.client.get(url, {"before": cursor})
            ids.extend(row["id"] for row in response.data["results"])
            cursor = response.data["next_before"]
        self.assertEqual(ids, [row.pk for row in records][::-1])
        self.assertNotIn(new.pk, ids)
        self.assertEqual(self.client.get(url).data["results"][0]["id"], new.pk)

    def test_invalid_query_parameters(self):
        url = reverse("experiment-create")
        for query in ("?before=", "?before=0", "?before=-1", "?before=1.5", "?before=true",
                      "?before=99999999999999999999", "?before=1&before=2", "?limit=1000", "?page=2"):
            with self.subTest(query=query):
                self.assertEqual(self.client.get(url + query).status_code, 400)
        self.assertEqual(self.client.get(url, {"before": "١"}).status_code, 400)

    def test_list_never_executes_and_reflects_status(self):
        record = Experiment.objects.create(name="Saved", status="failed")
        with patch("core.experiments.execution.run_sorting_benchmark") as run:
            response = self.client.get(reverse("experiment-create"))
            run.assert_not_called()
        self.assertEqual(response.data["results"][0]["status"], "failed")
        record.refresh_from_db()
        self.assertEqual(record.status, "failed")

    def test_cursor_does_not_require_existing_row_and_exhausted_page_is_empty(self):
        record = Experiment.objects.create(name="Only")
        response = self.client.get(reverse("experiment-create"), {"before": record.pk})
        self.assertEqual(response.data, {"results": [], "next_before": None})
        response = self.client.get(reverse("experiment-create"), {"before": record.pk + 100})
        self.assertEqual(response.data["results"][0]["id"], record.pk)
