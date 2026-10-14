"""Validate browser snapshots without rerunning algorithms or trusting browser timings."""
import copy
import math
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .api import ExperimentSerializer
from .persistence import store_experiment

ALGORITHMS = {"linear": "Linear Search", "binary": "Binary Search", "jump": "Jump Search", "exponential": "Exponential Search"}
ERRORS = {"requires_sorted_input", "runner_error", "invalid_result", "invalid_clock"}
MAX_SAFE = 2**53 - 1


def require(condition):
    if not condition:
        raise serializers.ValidationError({"snapshot": "Invalid searching snapshot."})


def finite(value):
    # Match finite JS numbers, rejecting booleans and unrepresentable JSON integers.
    return type(value) in (int, float) and -1.7976931348623157e308 <= value <= 1.7976931348623157e308 and math.isfinite(value)


def integer(value, low, high):
    return type(value) is int and low <= value <= high


def validate_snapshot(data):
    require(isinstance(data, dict) and set(data) == {"name", "input", "results"})
    name, source, rows = data["name"], data["input"], data["results"]
    require(isinstance(name, str) and 1 <= len(name.strip()) <= 200)
    require(isinstance(source, dict) and set(source) == {"values", "target"})
    values, target = source["values"], source["target"]
    require(isinstance(values, list) and len(values) <= 10000 and all(finite(x) for x in values) and finite(target))
    sorted_input = all(values[i-1] <= values[i] for i in range(1, len(values)))
    require(isinstance(rows, list) and 1 <= len(rows) <= 4)
    algorithms = []
    for row in rows:
        require(isinstance(row, dict) and isinstance(row.get("algorithm"), str) and row["algorithm"] in ALGORITHMS)
        algorithm = row["algorithm"]
        require(algorithm not in algorithms)
        algorithms.append(algorithm)
        precondition = algorithm != "linear" and not sorted_input
        if row.get("status") == "error":
            require(set(row) == {"algorithm", "status", "error"})
            require(isinstance(row["error"], str) and row["error"] in ERRORS)
            require((row["error"] == "requires_sorted_input") == precondition)
            continue
        require(row.get("status") == "completed" and not precondition)
        require(set(row) == {"algorithm", "status", "found", "correct", "index", "executionTimeMs", "probeCount", "comparisons", "probes"})
        require(type(row["found"]) is bool and type(row["correct"]) is bool)
        index, probes = row["index"], row["probes"]
        require(index is None or integer(index, 0, len(values)-1))
        require(isinstance(probes, list) and len(probes) <= 100000 and all(integer(x, 0, len(values)-1) for x in probes))
        require(index is None or index in probes)
        require(row["found"] == (index is not None))
        correct = target not in values if index is None else values[index] == target
        require(row["correct"] == correct)
        require(integer(row["probeCount"], 0, 100000) and row["probeCount"] == len(probes))
        require(integer(row["comparisons"], len(probes), MAX_SAFE))
        require(finite(row["executionTimeMs"]) and 0 <= row["executionTimeMs"] <= MAX_SAFE)
    return name.strip(), copy.deepcopy(source), copy.deepcopy(rows), algorithms


@api_view(["POST"])
def save_searching(request):
    name, source, rows, algorithms = validate_snapshot(request.data)
    experiment = store_experiment(
        name=name, family="searching",
        status="failed" if any(row["status"] == "error" or not row["correct"] for row in rows) else "completed",
        input_snapshot={"version": 1, "source": "browser", "input": source, "algorithms": algorithms},
        results=[{"implementation_snapshot": {"algorithm": row["algorithm"], "name": ALGORITHMS[row["algorithm"]], "language": "typescript", "version": 1}, "measurement": row} for row in rows],
    )
    return Response(ExperimentSerializer(experiment).data, status=201)
