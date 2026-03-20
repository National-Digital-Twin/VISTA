# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Test the django project level views."""

from __future__ import annotations

from django.urls import reverse


def is_user_authenticated_true(request):  # noqa: ARG001
    """Mock that a user is authenticated."""
    return True


def is_user_authenticated_false(request):  # noqa: ARG001
    """Mock that a user is not authenticated."""
    return False


def test_ping_returns_200_user_authenticated(client, monkeypatch):
    """Test ping."""
    monkeypatch.setattr("core.views.is_user_authenticated", is_user_authenticated_true)
    assert client.get(reverse("ping")).content == b"OK"


def test_ping_returns_403_forbidden_user_not_authenticated(client, monkeypatch):
    """Test ping."""
    monkeypatch.setattr("core.views.is_user_authenticated", is_user_authenticated_false)
    response = client.get(reverse("ping"))
    assert response.status_code == 403


def test_health(client):
    """Test health."""
    assert client.get(reverse("health")).content == b"OK"
