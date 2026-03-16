# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Load a key from disk or generate a new one and store it."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.management.utils import get_random_secret_key

if TYPE_CHECKING:
    import pathlib


def get_secret_key(base_url: pathlib.Path) -> str:
    """Load a key from disk or generate a new one and store it."""
    path = base_url / ".django-secret-key"
    try:
        return path.read_text(encoding="utf8").strip()
    except FileNotFoundError:
        pass

    secret_key = get_random_secret_key()
    path.write_text(f"{secret_key}\n", encoding="utf8")
    return secret_key
