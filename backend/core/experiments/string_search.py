"""Persist bounded browser string-search snapshots without executing algorithms."""
import copy
from rest_framework import serializers
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.response import Response
from .api import ExperimentSerializer, SnapshotJSONRenderer
from .persistence import store_experiment
from .searching import finite, integer, MAX_SAFE

ALGORITHMS = {"naive": "Naive", "kmp": "KMP", "rabinKarp": "Rabin-Karp", "boyerMoore": "Boyer-Moore (bad-character)"}
ERRORS = {"preprocessing_error", "runner_error", "invalid_result", "invalid_clock"}


def require(condition):
    if not condition:
        raise serializers.ValidationError({"snapshot": "Invalid string-search snapshot."})


def units(value):
    # JS indexes UTF-16 units, including isolated surrogates; Python indexes code points.
    encoded = value.encode("utf-16-le", errors="surrogatepass")
    return tuple(encoded[i] + 256 * encoded[i+1] for i in range(0, len(encoded), 2))


def validate_snapshot(data):
    require(isinstance(data, dict) and set(data) == {"name", "input", "results"})
    name, source, rows = data["name"], data["input"], data["results"]
    require(isinstance(name, str) and 1 <= len(name.strip()) <= 200)
    require(not any(0xD800 <= ord(c) <= 0xDFFF for c in name))
    require(isinstance(source, dict) and set(source) == {"text", "pattern", "mode"})
    require(isinstance(source["text"], str) and isinstance(source["pattern"], str) and source["mode"] == "first")
    require(len(source["text"]) <= 10000 and len(source["pattern"]) <= 1000)
    text, pattern = units(source["text"]), units(source["pattern"])
    require(len(text) <= 10000 and len(pattern) <= 1000)
    # Independent literal oracle, no algorithm execution or timing verification.
    expected = next((i for i in range(len(text)-len(pattern)+1) if text[i:i+len(pattern)] == pattern), None)
    require(isinstance(rows, list) and 1 <= len(rows) <= 4)
    algorithms = []
    for row in rows:
        require(isinstance(row, dict) and isinstance(row.get("algorithm"), str) and row["algorithm"] in ALGORITHMS)
        require(row["algorithm"] not in algorithms and row.get("mode") == "first")
        algorithms.append(row["algorithm"])
        if row.get("status") == "error":
            require(set(row) == {"algorithm", "mode", "status", "error"})
            require(isinstance(row["error"], str) and row["error"] in ERRORS)
            continue
        require(row.get("status") == "completed")
        require(set(row) == {"algorithm", "mode", "status", "found", "correct", "index", "occurrenceIndexes", "preprocessingTimeMs", "executionTimeMs", "preprocessingComparisons", "comparisons", "alignments"})
        require(type(row["found"]) is bool and type(row["correct"]) is bool)
        index, alignments = row["index"], row["alignments"]
        require(index is None or integer(index, 0, len(text)-len(pattern)))
        require(isinstance(alignments, list) and len(alignments) <= 100000 and all(integer(i, 0, len(text)-len(pattern)) for i in alignments))
        require(index is None or index in alignments)
        require(row["found"] == (index is not None) and row["correct"] == (index == expected))
        occurrences = row["occurrenceIndexes"]
        require(isinstance(occurrences, list) and all(type(i) is int for i in occurrences) and occurrences == ([] if index is None else [index]))
        for key in ("preprocessingComparisons", "comparisons"):
            require(integer(row[key], 0, MAX_SAFE))
        for key in ("preprocessingTimeMs", "executionTimeMs"):
            require(finite(row[key]) and 0 <= row[key] <= MAX_SAFE)
    return name.strip(), copy.deepcopy(source), copy.deepcopy(rows), algorithms


@api_view(["POST"])
@renderer_classes([SnapshotJSONRenderer])
def save_string_search(request):
    name, source, rows, algorithms = validate_snapshot(request.data)
    experiment = store_experiment(
        name=name, family="string_search",
        status="failed" if any(row["status"] == "error" or not row["correct"] for row in rows) else "completed",
        input_snapshot={"version": 1, "source": "browser", "input": source, "algorithms": algorithms},
        results=[{"implementation_snapshot": {"algorithm": row["algorithm"], "name": ALGORITHMS[row["algorithm"]], "language": "typescript", "version": 1}, "measurement": row} for row in rows],
    )
    return Response(ExperimentSerializer(experiment).data, status=201)
