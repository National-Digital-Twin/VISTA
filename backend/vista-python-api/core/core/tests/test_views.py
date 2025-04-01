"""Test the django project level views."""

from __future__ import annotations

from django.urls import reverse


def test_ping(client):
    """Test ping."""
    assert client.get(reverse("ping")).content == b"OK"
