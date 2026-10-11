"""Bounded synchronous execution for the local MVP; no arbitrary imports/code."""
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import APIException, NotFound, ValidationError

from core.benchmarks.runner import MAX_BENCHMARK_SIZE, run_sorting_benchmark
from core.models import Experiment, ExperimentResult

MAX_PAIRS = 4
REGISTRY = {
    "sorting.bubble_sort": "bubble-sort",
    "sorting.insertion_sort": "insertion-sort",
    "sorting.selection_sort": "selection-sort",
    "sorting.merge_sort": "merge-sort",
    "sorting.quick_sort": "quick-sort",
}


def executable_algorithm(implementation):
    algorithm = REGISTRY.get(implementation.registry_key)
    if (algorithm and implementation.is_active and implementation.source_type == "built_in"
            and implementation.language == "python" and implementation.algorithm.problem.slug == "sorting"
            and implementation.algorithm.slug == algorithm):
        return algorithm
    return None


class AlreadyExecuted(APIException):
    status_code = 409
    default_detail = "Only draft experiments can run."
    default_code = "experiment_not_draft"


@transaction.atomic
def execute_experiment(experiment_id):
    # Conditional write claims the draft before reading configuration. SQLite serializes
    # writers; holding the transaction prevents a second request from running it again.
    claimed = Experiment.objects.filter(pk=experiment_id, status="draft", family="sorting").update(
        status="running", updated_at=timezone.now(), execution_error="",
    )
    if not claimed:
        if not Experiment.objects.filter(pk=experiment_id).exists():
            raise NotFound()
        raise AlreadyExecuted()
    experiment = Experiment.objects.get(pk=experiment_id)
    implementations = list(experiment.implementations.select_related("algorithm__problem").order_by("pk"))
    datasets = list(experiment.datasets.all())
    if not implementations or not datasets or len(implementations) * len(datasets) > MAX_PAIRS:
        raise ValidationError({"configuration": "Select between 1 and 4 implementation/dataset pairs."})
    resolved = []
    for implementation in implementations:
        algorithm = executable_algorithm(implementation)
        if not algorithm:
            raise ValidationError({"implementations": "Select executable active built-in Python sorting implementations."})
        resolved.append((implementation, algorithm))
    for dataset in datasets:
        # Revalidate stored definitions, including edits made outside the create API.
        if (not 1 <= dataset.size <= MAX_BENCHMARK_SIZE
                or dataset.dataset_type not in ("random", "sorted", "reversed", "nearly_sorted")
                or not -(2**31) <= dataset.seed <= 2**31 - 1):
            raise ValidationError({"datasets": "Execution requires valid datasets of 1–1000 items."})

    results = []
    try:
        for implementation, algorithm in resolved:
            for dataset in datasets:
                measurement = run_sorting_benchmark(algorithm, dataset.size, dataset.seed, dataset.dataset_type)
                results.append(ExperimentResult(
                    experiment=experiment,
                    implementation_snapshot={
                        "id": implementation.pk, "name": implementation.name,
                        "slug": implementation.slug, "algorithm": algorithm, "language": implementation.language,
                    },
                    measurement=measurement,
                ))
    except Exception:
        # No source, traceback or arbitrary exception message crosses the API boundary.
        experiment.status = "failed"
        experiment.execution_error = "runner_error"
    else:
        # Persist only complete batches. Storage exceptions roll the transaction back to draft.
        ExperimentResult.objects.bulk_create(results)
        experiment.status = "completed" if all(item.measurement["correct"] for item in results) else "failed"
        experiment.execution_error = "" if experiment.status == "completed" else "incorrect_result"
    experiment.save(update_fields=["status", "execution_error", "updated_at"])
    return experiment
