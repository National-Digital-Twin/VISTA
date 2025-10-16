"""Combine GraphQL schema with resolvers."""

import importlib.resources

from ariadne import load_schema_from_path, make_executable_schema

from api.resolvers import query

with importlib.resources.as_file(importlib.resources.files(__package__) / "schema.graphql") as _f:
    type_defs = load_schema_from_path(_f)
schema = make_executable_schema(type_defs, query, convert_names_case=True)
