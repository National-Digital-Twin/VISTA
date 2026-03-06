# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Test syntax and loading of types module."""

from importlib import import_module


def test_types_is_syntactically_valid():
    """Test that we can import the types module."""
    import_module("api.types")
