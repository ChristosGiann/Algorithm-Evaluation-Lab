from .experiments.pathfinding import save_pathfinding
from django.urls import path

from .views import AlgorithmListAPIView, health_check
from .benchmarks.api import bubble_sort_benchmark, sorting_benchmark, sorting_comparison, persist_comparison
from .experiments.api import ExperimentCreateAPIView, ExperimentDetailAPIView, experiment_run
from .custom_python.benchmark_api import custom_benchmark
from .custom_python.api import validate_custom_python


urlpatterns = [
    path("experiments/pathfinding/", save_pathfinding, name="save-pathfinding"),
    path("benchmarks/sorting/custom/", custom_benchmark, name="custom-sorting-benchmark"),
    path("benchmarks/sorting/compare/save/", persist_comparison, name="save-comparison"),
    path("benchmarks/sorting/compare/", sorting_comparison, name="sorting-comparison"),
    path("experiments/<int:pk>/run/", experiment_run, name="experiment-run"),
    path("benchmarks/sorting/", sorting_benchmark, name="sorting-benchmark"),
    path("implementations/validate-python/", validate_custom_python, name="validate-custom-python"),
    path("experiments/", ExperimentCreateAPIView.as_view(), name="experiment-create"),
    path("experiments/<int:pk>/", ExperimentDetailAPIView.as_view(), name="experiment-detail"),
    path("benchmarks/bubble-sort/", bubble_sort_benchmark, name="bubble-sort-benchmark"),
    path(
        "health/",
        health_check,
        name="health",
    ),
    path(
        "algorithms/",
        AlgorithmListAPIView.as_view(),
        name="algorithm-list",
    ),
]
