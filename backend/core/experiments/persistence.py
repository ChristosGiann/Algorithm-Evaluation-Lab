"""Atomic storage of already validated snapshots; never executes algorithms.

Family adapters own validation, provenance, limits and metric semantics.
Both server-signed sorting and browser pathfinding use this boundary.
"""
from copy import deepcopy
from django.db import transaction
from core.models import DatasetDefinition, Experiment, ExperimentResult


@transaction.atomic
def store_experiment(*, name, family, results, status="completed", execution_error="",
                     input_snapshot=None, implementations=(), datasets=()):
    if family not in {value for value, _ in Experiment._meta.get_field("family").choices}:
        raise ValueError("Unsupported experiment family")
    if status not in ("completed", "failed") or not results:
        raise ValueError("Only finished snapshots can be stored")
    experiment = Experiment.objects.create(
        name=name, family=family, status=status, execution_error=execution_error,
        input_snapshot=deepcopy(input_snapshot),
    )
    experiment.implementations.set(implementations)
    DatasetDefinition.objects.bulk_create([
        DatasetDefinition(experiment=experiment, **config) for config in datasets
    ])
    ExperimentResult.objects.bulk_create([
        ExperimentResult(experiment=experiment,
                         implementation_snapshot=deepcopy(row["implementation_snapshot"]),
                         measurement=deepcopy(row["measurement"]))
        for row in results
    ])
    return experiment
