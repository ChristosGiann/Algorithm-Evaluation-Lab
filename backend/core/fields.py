import json
from django.db import models


class LiteralSnapshotField(models.JSONField):
    """Whole-document snapshots preserve NUL and isolated UTF-16 escapes.

    PostgreSQL jsonb rejects these valid browser inputs; json stores their escaped
    representation. This field is for whole-document reads, not JSON operators.
    """
    def db_type(self, connection):
        return "json" if connection.vendor == "postgresql" else super().db_type(connection)

    def get_db_prep_value(self, value, connection, prepared=False):
        if connection.vendor == "postgresql":
            from psycopg.types.json import Json
            return Json(value, dumps=lambda item: json.dumps(item, cls=self.encoder, ensure_ascii=True))
        return super().get_db_prep_value(value, connection, prepared)

    def from_db_value(self, value, expression, connection):
        if connection.vendor == "postgresql" and not isinstance(value, str):
            return value
        return super().from_db_value(value, expression, connection)
