"""Save server-signed completed comparisons into the existing experiment domain."""
from django.core import signing
from django.db import transaction
from rest_framework import serializers
from core.models import AlgorithmImplementation
from core.experiments.execution import executable_algorithm
from core.experiments.persistence import store_experiment

SALT = "sorting-comparison-v1"
MAX_AGE = 3600


def sign_comparison(result):
    if all(row["status"] == "completed" and row.get("source_type", "built_in") == "built_in" for row in result["results"]):
        return signing.dumps(result, salt=SALT, compress=True)
    return None


@transaction.atomic
def save_comparison(name, token):
    try:
        result = signing.loads(token, salt=SALT, max_age=MAX_AGE)
    except signing.BadSignature:
        raise serializers.ValidationError({"token": "Invalid or expired comparison. Run again."})
    implementations = {}
    for item in AlgorithmImplementation.objects.select_related("algorithm__problem"):
        algorithm = executable_algorithm(item)
        if algorithm:
            implementations[algorithm] = item
    slugs = [row["algorithm"] for row in result["results"]]
    if any(slug not in implementations for slug in slugs):
        raise serializers.ValidationError({"algorithms": "Catalogue implementation unavailable."})
    correct = all(row["measurement"]["correct"] for row in result["results"])
    snapshots = []
    for row in result["results"]:
        item = implementations[row["algorithm"]]
        snapshots.append({"measurement": row["measurement"], "implementation_snapshot": {
            "id": item.pk, "name": item.name, "slug": item.slug,
            "algorithm": row["algorithm"], "language": item.language,
            "source_type": "built_in", "comparison": True,
        }})
    return store_experiment(
        name=name, family="sorting", results=snapshots,
        status="completed" if correct else "failed",
        execution_error="" if correct else "incorrect_result",
        implementations=[implementations[slug] for slug in slugs],
        datasets=[{key: result[key] for key in ("dataset_type", "size", "seed")}],
    )
