"""Test syntax and loading of types module."""

from importlib import import_module


def test_types_is_syntactically_valid():
    """Test that we can import the types module."""
    import_module("api.types")
