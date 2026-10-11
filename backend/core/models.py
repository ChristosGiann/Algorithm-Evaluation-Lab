from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator


class Problem(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    slug = models.SlugField(
        max_length=100,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Algorithm(models.Model):
    problem = models.ForeignKey(
        Problem,
        on_delete=models.CASCADE,
        related_name="algorithms",
    )

    name = models.CharField(
        max_length=100,
    )

    slug = models.SlugField(
        max_length=100,
    )

    description = models.TextField(
        blank=True,
    )

    best_case_complexity = models.CharField(
        max_length=50,
        blank=True,
    )

    average_case_complexity = models.CharField(
        max_length=50,
        blank=True,
    )

    worst_case_complexity = models.CharField(
        max_length=50,
        blank=True,
    )

    space_complexity = models.CharField(
        max_length=50,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["name"]

        constraints = [
            models.UniqueConstraint(
                fields=["problem", "slug"],
                name="unique_algorithm_slug_per_problem",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.problem.name})"


class AlgorithmImplementation(models.Model):
    class Language(models.TextChoices):
        PYTHON = "python", "Python"

    class SourceType(models.TextChoices):
        BUILT_IN = "built_in", "Built-in"
        CUSTOM = "custom", "Custom"

    algorithm = models.ForeignKey(
        Algorithm,
        on_delete=models.CASCADE,
        related_name="implementations",
    )

    name = models.CharField(
        max_length=100,
    )

    slug = models.SlugField(
        max_length=100,
    )

    language = models.CharField(
        max_length=20,
        choices=Language.choices,
        default=Language.PYTHON,
    )

    source_type = models.CharField(
        max_length=20,
        choices=SourceType.choices,
        default=SourceType.BUILT_IN,
    )

    registry_key = models.CharField(
        max_length=150,
        unique=True,
        blank=True,
        null=True,
        help_text=(
            "Το μοναδικό key που θα συνδέει την εγγραφή "
            "με built-in Python implementation."
        ),
    )

    description = models.TextField(
        blank=True,
    )

    is_reference = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["algorithm__name", "name"]

        constraints = [
            models.UniqueConstraint(
                fields=["algorithm", "slug"],
                name="unique_implementation_slug_per_algorithm",
            ),
        ]

    def __str__(self):
        return f"{self.algorithm.name} — {self.name}"


class Experiment(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    family = models.CharField(max_length=20, choices=[("sorting", "Sorting"), ("pathfinding", "Pathfinding")], default="sorting")
    input_snapshot = models.JSONField(null=True, blank=True)
    name = models.CharField(max_length=200)
    execution_error = models.CharField(max_length=40, blank=True)
    implementations = models.ManyToManyField(
        AlgorithmImplementation, related_name="experiments",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-pk"]
        constraints = [models.CheckConstraint(
            condition=models.Q(status__in=["draft", "pending", "running", "completed", "failed"]),
            name="experiment_valid_status",
        )]

    def __str__(self):
        return self.name


class DatasetDefinition(models.Model):
    """Configuration owned by one experiment, not a stored generated array."""

    class Kind(models.TextChoices):
        RANDOM = "random", "Random"
        SORTED = "sorted", "Sorted"
        REVERSED = "reversed", "Reversed"
        NEARLY_SORTED = "nearly_sorted", "Nearly sorted"

    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, related_name="datasets")
    dataset_type = models.CharField(max_length=20, choices=Kind.choices)
    size = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(100_000)])
    seed = models.IntegerField(default=42, validators=[MinValueValidator(-(2**31)), MaxValueValidator(2**31 - 1)])

    class Meta:
        ordering = ["pk"]
        constraints = [
            models.CheckConstraint(condition=models.Q(size__gte=1, size__lte=100_000), name="dataset_valid_size"),
            models.CheckConstraint(condition=models.Q(seed__gte=-(2**31), seed__lte=2**31 - 1), name="dataset_valid_seed"),
            models.CheckConstraint(condition=models.Q(dataset_type__in=["random", "sorted", "reversed", "nearly_sorted"]), name="dataset_valid_type"),
        ]


class ExperimentResult(models.Model):
    """Historical snapshots survive catalogue and dataset-definition edits/deletions."""
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, related_name="results")
    implementation_snapshot = models.JSONField()
    measurement = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["pk"]
