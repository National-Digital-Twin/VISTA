"""Tests for generating and storing a secret key on disk."""

from __future__ import annotations

from typing import TYPE_CHECKING

from core.secret_key import get_secret_key

if TYPE_CHECKING:
    import pathlib


def test_secret_key_set(tmp_path: pathlib.Path) -> None:
    """Test for when the key is already on disk."""
    (tmp_path / ".django-secret-key").write_text("hello\n", encoding="utf8")
    assert get_secret_key(tmp_path) == "hello"


def test_secret_key_not_set(tmp_path: pathlib.Path) -> None:
    """Test for when the key is not on disk."""
    secret_key = get_secret_key(tmp_path)
    assert (tmp_path / ".django-secret-key").read_text(encoding="utf8") == f"{secret_key}\n"
