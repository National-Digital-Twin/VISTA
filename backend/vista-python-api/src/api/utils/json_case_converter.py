# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""A renderer and parser for converting JSON fields between camel case and snake case."""

import re

from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer


def to_camel_case(s):
    """Convert a string to camel case."""
    parts = s.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


def to_snake_case(s):
    """Convert a string from camel case to snake case."""
    return re.sub(r"(?<!^)(?=[A-Z])", "_", s).lower()


def camelize(data):
    """Convert dictionary keys or list items to camel case."""
    if isinstance(data, dict):
        return {to_camel_case(k): camelize(v) for k, v in data.items()}
    if isinstance(data, list):
        return [camelize(i) for i in data]
    return data


def underscoreize(data):
    """Convert dictionary keys or list items to snake case."""
    if isinstance(data, dict):
        return {to_snake_case(k): underscoreize(v) for k, v in data.items()}
    if isinstance(data, list):
        return [underscoreize(i) for i in data]
    return data


class CamelCaseJSONRenderer(JSONRenderer):
    """A renderer for converting JSON fields into camel case."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        """Render camelized data."""
        data = camelize(data)
        return super().render(data, accepted_media_type, renderer_context)


class CamelCaseJSONParser(JSONParser):
    """A parser for converting camel case JSON fields into snake case."""

    def parse(self, stream, media_type=None, parser_context=None):
        """Parse incoming camelCase data into snake_case."""
        data = super().parse(stream, media_type, parser_context)
        return underscoreize(data)
