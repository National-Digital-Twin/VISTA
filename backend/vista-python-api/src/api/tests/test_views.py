# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Test views."""

from __future__ import annotations

import http

from django.urls import reverse


def test_multipart_blocked(client):
    """Test that multipart/form-data requests are blocked."""
    response = client.post(reverse("graphql"), content_type="multipart/form-data", data=b"")
    assert response.content == b"Posted content must be of type application/json"
    assert response.status_code == http.HTTPStatus.BAD_REQUEST
