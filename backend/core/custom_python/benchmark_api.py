from django.conf import settings
from rest_framework import serializers
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from core.benchmarks.api import BenchmarkRequestSerializer
from core.benchmarks.runner import benchmark_dataset
from .benchmark import error_result, measure_custom


def execution_allowed(request):
    return (not settings.PRODUCTION and settings.DEBUG and settings.ENABLE_TRUSTED_CUSTOM_EXECUTION
            and request.META.get("REMOTE_ADDR") in ("127.0.0.1", "::1")
            and request.META.get("HTTP_ORIGIN") in settings.CORS_ALLOWED_ORIGINS)


class CustomBenchmarkSerializer(BenchmarkRequestSerializer):
    source = serializers.CharField(max_length=32768, trim_whitespace=False)
    trusted = serializers.BooleanField()

    def validate_trusted(self, value):
        if value is not True:
            raise serializers.ValidationError("Trusted local code acknowledgement required.")
        return value


@api_view(["POST"])
@parser_classes([JSONParser])
def custom_benchmark(request):
    if not execution_allowed(request):
        return Response(error_result("execution_disabled"))
    serializer = CustomBenchmarkSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    dataset = benchmark_dataset(data["size"], data["seed"], data["dataset_type"])
    return Response(measure_custom(data["source"], dataset))
