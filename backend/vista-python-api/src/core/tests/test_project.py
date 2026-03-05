# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""test the django project, mainly for coverage."""

from __future__ import annotations

from core import gunicorn
from core.asgi import asgi_application
from core.wsgi import wsgi_application


def test_wsgi():
    """Import the wsgi app just to get coverage."""
    assert wsgi_application is not None


def test_asgi():
    """Import the asgi app just to get coverage."""
    assert asgi_application is not None


def test_gunicorn():
    """Import the gunicorn config just to get coverage."""
    assert gunicorn is not None
