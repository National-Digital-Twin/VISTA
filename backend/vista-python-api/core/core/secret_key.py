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
