"""A renderer for converting JSON fields into camel case."""

from rest_framework.renderers import JSONRenderer


def to_camel_case(s):
    """Convert a string to camel case."""
    parts = s.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


def camelize(data):
    """Convert dictionary keys or list items to camel case."""
    if isinstance(data, dict):
        return {to_camel_case(k): camelize(v) for k, v in data.items()}
    if isinstance(data, list):
        return [camelize(i) for i in data]
    return data


class CamelCaseJSONRenderer(JSONRenderer):
    """A renderer for converting JSON fields into camel case."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        """Render camelized data."""
        data = camelize(data)
        return super().render(data, accepted_media_type, renderer_context)
