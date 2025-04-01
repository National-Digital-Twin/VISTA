"""test the django project, mainly for coverage."""

from __future__ import annotations


def test_wsgi():
    """Import the wsgi app just to get coverage."""
    from core.wsgi import application

    assert application is not None


def test_asgi():
    """Import the asgi app just to get coverage."""
    from core.asgi import application

    assert application is not None


def test_gunicorn():
    """Import the gunicorn config just to get coverage."""
    from core import gunicorn

    assert gunicorn is not None
