"""Custom migration for loading fixtures.

Previously we used `call_command` to run `loaddata`; this is a bad idea, however, because
that uses the _current_ version of a model. Migrations need to run with the version of a
model _at the time of the migration_. For instance, if a field were later added to a model,
then the migration would break.
"""

# pragma: no cover

import gzip
import itertools
import json
import os
from collections.abc import Callable, Iterable
from pathlib import Path
from typing import Any, TypeVar

from django.core.management.color import no_style
from django.db import connection, migrations, models

M = TypeVar("M", bound=models.Model)
T = TypeVar("T")


def _reset_sequences[M](model: M) -> None:
    # Based on code from the loaddata command
    sequence_sql = connection.ops.sequence_reset_sql(no_style(), [model])

    with connection.cursor() as cursor:
        for line in sequence_sql:
            cursor.execute(line)


def _process_fixture[M](
    model: M,
    fixture: Path,
    load_entity: Callable[[Any, dict[str, Any]], T],
    process_entities: Callable[[Iterable[T]], None],
):
    with gzip.open(fixture, "rt", encoding="utf-8") as f:
        fixture_data = json.load(f)

    meta = model._meta  # noqa: SLF001

    expected_modelname = f"{meta.app_label}.{meta.model_name}"
    entities: list[T] = []

    for entity in fixture_data:
        if entity["model"] != expected_modelname:
            raise ValueError(
                f"Fixture entity with incorrect model {entity['model']!r}, "
                f"expected {expected_modelname!r}"
            )

        entities.append(load_entity(entity["pk"], entity["fields"]))

    for batch in itertools.batched(entities, n=1000):
        process_entities(batch)

    _reset_sequences(model)


def _load_fixture[M](model: M, fixture: Path) -> None:
    def load_entity(pk: Any, fields: dict[str, Any]) -> M:
        return model(pk=pk, **fields)

    def process_entities(entities: Iterable[M]) -> None:
        model.objects.bulk_create(entities)

    _process_fixture(model, fixture, load_entity, process_entities)


def _unload_fixture[M](model: M, fixture: Path) -> None:
    def load_entity(pk: Any, _fields: dict[str, Any]) -> M:
        return pk

    def process_entities(pks: Iterable[Any]) -> None:
        model.objects.filter(pk__in=pks).delete()

    _process_fixture(model, fixture, load_entity, process_entities)


class LoadFixture(migrations.RunPython):
    """Migration to load fixture data into the database."""

    def __init__(self, model: str, fixture: Path, elidable: bool = False) -> None:
        """Construct from a model name and fixture path.

        The model name is, e.g., "api.lowbridge". The fixture path is some path to
        fixture data in json.gz format.
        """
        self.fixture = fixture
        self.model = model
        super().__init__(self._forwards, self._reverse, elidable=elidable)

    def _get_model_class(self, apps) -> type[models.Model]:
        return apps.get_model(self.model)

    def _in_test_environment(self) -> bool:
        return bool(os.environ.get("PYTEST_CURRENT_TEST"))

    def _forwards(self, apps, _schema_editor):
        if self._in_test_environment():
            return

        model = self._get_model_class(apps)
        _load_fixture(model, self.fixture)

    def _reverse(self, apps, _schema_editor):
        if self._in_test_environment():
            return

        model = self._get_model_class(apps)
        _unload_fixture(model, self.fixture)
