"""Type definitions for type-checking."""

from __future__ import annotations

type GeoJSON = dict[str, GeoJSON] | list[GeoJSON] | str | float | bool | None
