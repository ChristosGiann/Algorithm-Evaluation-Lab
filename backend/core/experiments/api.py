from django.db import transaction
from rest_framework import generics, serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import AlgorithmImplementation, DatasetDefinition, Experiment, ExperimentResult


class StrictIntegerField(serializers.IntegerField):
    def to_internal_value(self, data):
        if type(data) is not int:
            self.fail("invalid")
        return super().to_internal_value(data)


class StrictInputSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        if isinstance(data, dict):
            allowed = {name for name, field in self.fields.items() if not field.read_only}
            unexpected = set(data) - allowed
            if unexpected:
                raise serializers.ValidationError({key: ["Unknown or read-only field."] for key in unexpected})
        return super().to_internal_value(data)


class DatasetDefinitionSerializer(StrictInputSerializer):
    size = StrictIntegerField(min_value=1, max_value=100_000)
    seed = StrictIntegerField(default=42, min_value=-(2**31), max_value=2**31 - 1)

    class Meta:
        model = DatasetDefinition
        fields = ("id", "dataset_type", "size", "seed")
        read_only_fields = ("id",)


class SelectedImplementationSerializer(serializers.ModelSerializer):
    algorithm = serializers.CharField(source="algorithm.slug")

    class Meta:
        model = AlgorithmImplementation
        fields = ("id", "name", "slug", "algorithm", "language", "is_active", "source_type")


class ExperimentResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperimentResult
        fields = ("id", "implementation_snapshot", "measurement", "created_at")
        read_only_fields = fields


class ExperimentSerializer(StrictInputSerializer):
    results = ExperimentResultSerializer(many=True, read_only=True)
    implementation_ids = serializers.ListField(
        child=StrictIntegerField(min_value=1), min_length=1, max_length=20, write_only=True,
    )
    implementations = SelectedImplementationSerializer(many=True, read_only=True)
    datasets = DatasetDefinitionSerializer(many=True, allow_empty=False)

    class Meta:
        model = Experiment
        fields = ("id", "name", "status", "implementation_ids", "implementations", "datasets", "results", "execution_error", "created_at", "updated_at", "family", "input_snapshot")
        read_only_fields = ("id", "status", "results", "execution_error", "created_at", "updated_at", "family", "input_snapshot")

    def validate_implementation_ids(self, ids):
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Duplicate implementation IDs are not allowed.")
        implementations = list(AlgorithmImplementation.objects.filter(
            pk__in=ids, is_active=True,
            source_type=AlgorithmImplementation.SourceType.BUILT_IN,
            algorithm__problem__slug="sorting",
        ))
        if len(implementations) != len(ids):
            raise serializers.ValidationError("Select existing active built-in sorting implementations.")
        return implementations

    def validate_datasets(self, datasets):
        if len(datasets) > 20:
            raise serializers.ValidationError("At most 20 dataset definitions are allowed.")
        configurations = [(item["dataset_type"], item["size"], item["seed"]) for item in datasets]
        if len(set(configurations)) != len(configurations):
            raise serializers.ValidationError("Duplicate dataset configurations are not allowed.")
        return datasets

    @transaction.atomic
    def create(self, validated_data):
        implementations = validated_data.pop("implementation_ids")
        datasets = validated_data.pop("datasets")
        experiment = Experiment.objects.create(**validated_data)
        experiment.implementations.set(implementations)
        DatasetDefinition.objects.bulk_create([
            DatasetDefinition(experiment=experiment, **config) for config in datasets
        ])
        return experiment


class ExperimentSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Experiment
        fields = ("id", "name", "status", "created_at", "updated_at", "family")
        read_only_fields = fields


class ExperimentCreateAPIView(generics.CreateAPIView):
    serializer_class = ExperimentSerializer

    def get(self, request):
        params = request.query_params
        if set(params) - {"before"} or any(len(params.getlist(key)) != 1 for key in params):
            raise serializers.ValidationError({"query": "Only one optional before parameter is accepted."})
        before = params.get("before")
        queryset = Experiment.objects.order_by("-pk")
        if before is not None:
            if (not before.isascii() or not before.isdecimal() or len(before) > 19
                    or not 1 <= int(before) <= 2**63 - 1):
                raise serializers.ValidationError({"before": "Use a positive 64-bit integer ID."})
            queryset = queryset.filter(pk__lt=int(before))
        # One bounded query; no result blobs, relationship queries, or total-count scan.
        rows = list(queryset.only("id", "name", "status", "created_at", "updated_at", "family")[:11])
        page = rows[:10]
        return Response({
            "results": ExperimentSummarySerializer(page, many=True).data,
            "next_before": page[-1].pk if len(rows) > 10 else None,
        })


class ExperimentDetailAPIView(generics.RetrieveAPIView):
    serializer_class = ExperimentSerializer
    queryset = Experiment.objects.prefetch_related("implementations__algorithm", "datasets", "results")


@api_view(["POST"])
def experiment_run(request, pk):
    from .execution import execute_experiment

    if not isinstance(request.data, dict) or request.data:
        raise serializers.ValidationError({"request": "Send an empty JSON object."})
    experiment = execute_experiment(pk)
    return Response(ExperimentSerializer(experiment).data)
