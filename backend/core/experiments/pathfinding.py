"""Store bounded browser measurements, without claiming server verification or rerunning."""
import copy
import math

from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .persistence import store_experiment
from .api import ExperimentSerializer

ALGORITHMS = {"bfs": "BFS", "dfs": "DFS", "dijkstra": "Dijkstra", "astar": "A*"}


def require(condition):
    if not condition:
        raise serializers.ValidationError({"snapshot": "Invalid pathfinding snapshot."})


def integer(value, low, high):
    return type(value) is int and low <= value <= high


def number(value, high):
    return type(value) in (int, float) and 0 <= value <= high and math.isfinite(value)


def validate_snapshot(data):
    require(isinstance(data, dict) and set(data) == {"name", "input", "results"})
    name = data["name"]
    require(isinstance(name, str) and 1 <= len(name.strip()) <= 200)
    grid = data["input"]
    require(isinstance(grid, dict) and set(grid) == {"rows", "cols", "start", "end", "walls", "costs"})
    require(integer(grid["rows"], 1, 10000) and integer(grid["cols"], 1, 10000))
    size = grid["rows"] * grid["cols"]
    require(size <= 10000)
    require(isinstance(grid["walls"], list) and len(grid["walls"]) == size and all(type(x) is bool for x in grid["walls"]))
    require(isinstance(grid["costs"], list) and len(grid["costs"]) == size and all(number(x, (2**53 - 1) / size) for x in grid["costs"]))
    def walkable(value):
        return integer(value, 0, size - 1) and not grid["walls"][value]
    require(walkable(grid["start"]) and walkable(grid["end"]))
    results = data["results"]
    require(isinstance(results, list) and 1 <= len(results) <= 4)
    algorithms = []
    for result in results:
        require(isinstance(result, dict) and set(result) == {
            "algorithm", "status", "found", "executionTimeMs", "visitedNodeCount", "pathLength", "pathCost", "visited", "path"})
        require(isinstance(result["algorithm"], str) and result["algorithm"] in ALGORITHMS)
        algorithms.append(result["algorithm"])
        require(result["status"] == "completed" and type(result["found"]) is bool)
        require(number(result["executionTimeMs"], 2**53 - 1))
        visited, path = result["visited"], result["path"]
        require(isinstance(visited, list) and 1 <= len(visited) <= size and all(walkable(x) for x in visited))
        require(len(set(visited)) == len(visited) and visited[0] == grid["start"])
        require(integer(result["visitedNodeCount"], 1, size) and result["visitedNodeCount"] == len(visited))
        require(isinstance(path, list) and len(path) <= size and all(walkable(x) for x in path))
        require(len(set(path)) == len(path))
        if result["found"]:
            require(len(path) > 0 and path[0] == grid["start"] and path[-1] == grid["end"])
            require(set(path) <= set(visited) and visited[-1] == grid["end"])
            require(integer(result["pathLength"], 0, size - 1) and result["pathLength"] == len(path) - 1)
            cols = grid["cols"]
            require(all(abs(a // cols - b // cols) + abs(a % cols - b % cols) == 1 for a, b in zip(path, path[1:])))
            cost = sum(grid["costs"][cell] for cell in path[1:])
            require(number(result["pathCost"], 2**53 - 1) and math.isclose(result["pathCost"], cost, rel_tol=1e-12, abs_tol=1e-12))
        else:
            require(not path and result["pathLength"] is None and result["pathCost"] is None and grid["end"] not in visited)
    require(len(set(algorithms)) == len(algorithms))
    return name.strip(), copy.deepcopy(grid), copy.deepcopy(results), algorithms


@api_view(["POST"])
def save_pathfinding(request):
    name, grid, results, algorithms = validate_snapshot(request.data)
    experiment = store_experiment(
        name=name, family="pathfinding", input_snapshot={
            "version": 1, "source": "browser", "movement": "cardinal", "costRule": "enter-cell-exclude-start",
            "grid": grid, "algorithms": algorithms,
        }, results=[{
            "implementation_snapshot": {"algorithm": row["algorithm"], "name": ALGORITHMS[row["algorithm"]], "language": "typescript", "version": 1},
            "measurement": row,
        } for row in results],
    )
    return Response(ExperimentSerializer(experiment).data, status=201)
