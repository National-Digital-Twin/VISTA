# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Tests for JSON case conversion utilities."""

import io
import json

import pytest

from api.utils.json_case_converter import (
    CamelCaseJSONParser,
    CamelCaseJSONRenderer,
    camelize,
    to_camel_case,
    to_snake_case,
    underscoreize,
)


class TestToCamelCase:
    """Tests for to_camel_case function."""

    def test_single_word(self):
        assert to_camel_case("name") == "name"

    def test_two_words(self):
        assert to_camel_case("first_name") == "firstName"

    def test_multiple_words(self):
        assert to_camel_case("this_is_a_test") == "thisIsATest"

    def test_already_camel_case(self):
        assert to_camel_case("firstName") == "firstName"

    def test_empty_string(self):
        assert to_camel_case("") == ""


class TestToSnakeCase:
    """Tests for to_snake_case function."""

    def test_single_word(self):
        assert to_snake_case("name") == "name"

    def test_two_words(self):
        assert to_snake_case("firstName") == "first_name"

    def test_multiple_words(self):
        assert to_snake_case("thisIsATest") == "this_is_a_test"

    def test_already_snake_case(self):
        assert to_snake_case("first_name") == "first_name"

    def test_empty_string(self):
        assert to_snake_case("") == ""

    def test_consecutive_capitals(self):
        assert to_snake_case("getHTTPResponse") == "get_h_t_t_p_response"


class TestCamelize:
    """Tests for camelize function."""

    def test_simple_dict(self):
        data = {"first_name": "John", "last_name": "Doe"}
        assert camelize(data) == {"firstName": "John", "lastName": "Doe"}

    def test_nested_dict(self):
        data = {"user_info": {"first_name": "John", "is_active": True}}
        assert camelize(data) == {"userInfo": {"firstName": "John", "isActive": True}}

    def test_list_of_dicts(self):
        data = [{"first_name": "John"}, {"first_name": "Jane"}]
        assert camelize(data) == [{"firstName": "John"}, {"firstName": "Jane"}]

    def test_dict_with_list(self):
        data = {"user_list": [{"user_name": "john"}, {"user_name": "jane"}]}
        assert camelize(data) == {"userList": [{"userName": "john"}, {"userName": "jane"}]}

    def test_primitive_values(self):
        assert camelize("string") == "string"
        assert camelize(123) == 123
        assert camelize(True) is True
        assert camelize(None) is None

    def test_empty_dict(self):
        assert camelize({}) == {}

    def test_empty_list(self):
        assert camelize([]) == []


class TestUnderscoreize:
    """Tests for underscoreize function."""

    def test_simple_dict(self):
        data = {"firstName": "John", "lastName": "Doe"}
        assert underscoreize(data) == {"first_name": "John", "last_name": "Doe"}

    def test_nested_dict(self):
        data = {"userInfo": {"firstName": "John", "isActive": True}}
        assert underscoreize(data) == {"user_info": {"first_name": "John", "is_active": True}}

    def test_list_of_dicts(self):
        data = [{"firstName": "John"}, {"firstName": "Jane"}]
        assert underscoreize(data) == [{"first_name": "John"}, {"first_name": "Jane"}]

    def test_dict_with_list(self):
        data = {"userList": [{"userName": "john"}, {"userName": "jane"}]}
        assert underscoreize(data) == {"user_list": [{"user_name": "john"}, {"user_name": "jane"}]}

    def test_primitive_values(self):
        assert underscoreize("string") == "string"
        assert underscoreize(123) == 123
        assert underscoreize(True) is True
        assert underscoreize(None) is None

    def test_empty_dict(self):
        assert underscoreize({}) == {}

    def test_empty_list(self):
        assert underscoreize([]) == []

    def test_already_snake_case(self):
        data = {"first_name": "John"}
        assert underscoreize(data) == {"first_name": "John"}


class TestCamelCaseJSONRenderer:
    """Tests for CamelCaseJSONRenderer class."""

    def test_renders_dict_with_camel_case_keys(self):
        renderer = CamelCaseJSONRenderer()
        data = {"first_name": "John", "is_active": True}

        result = renderer.render(data)

        assert json.loads(result) == {"firstName": "John", "isActive": True}

    def test_renders_nested_structure(self):
        renderer = CamelCaseJSONRenderer()
        data = {"user_data": {"focus_area_id": "123", "asset_type_id": "456"}}

        result = renderer.render(data)

        assert json.loads(result) == {"userData": {"focusAreaId": "123", "assetTypeId": "456"}}

    def test_renders_list(self):
        renderer = CamelCaseJSONRenderer()
        data = [{"is_active": True}, {"is_active": False}]

        result = renderer.render(data)

        assert json.loads(result) == [{"isActive": True}, {"isActive": False}]


class TestCamelCaseJSONParser:
    """Tests for CamelCaseJSONParser class."""

    def test_parses_camel_case_to_snake_case(self):
        parser = CamelCaseJSONParser()
        data = {"firstName": "John", "isActive": True}
        stream = io.BytesIO(json.dumps(data).encode())

        result = parser.parse(stream)

        assert result == {"first_name": "John", "is_active": True}

    def test_parses_nested_structure(self):
        parser = CamelCaseJSONParser()
        data = {"userData": {"focusAreaId": "123", "assetTypeId": "456"}}
        stream = io.BytesIO(json.dumps(data).encode())

        result = parser.parse(stream)

        assert result == {"user_data": {"focus_area_id": "123", "asset_type_id": "456"}}

    def test_parses_list(self):
        parser = CamelCaseJSONParser()
        data = [{"isActive": True}, {"isActive": False}]
        stream = io.BytesIO(json.dumps(data).encode())

        result = parser.parse(stream)

        assert result == [{"is_active": True}, {"is_active": False}]

    def test_handles_already_snake_case(self):
        parser = CamelCaseJSONParser()
        data = {"first_name": "John", "is_active": True}
        stream = io.BytesIO(json.dumps(data).encode())

        result = parser.parse(stream)

        assert result == {"first_name": "John", "is_active": True}


@pytest.mark.django_db
class TestCaseConversionIntegration:
    """Integration tests for case conversion round-trip."""

    def test_round_trip_preserves_data(self):
        original = {"focusAreaId": "123", "isActive": True, "assetTypeId": "456"}

        parser = CamelCaseJSONParser()
        stream = io.BytesIO(json.dumps(original).encode())
        parsed = parser.parse(stream)

        renderer = CamelCaseJSONRenderer()
        rendered = json.loads(renderer.render(parsed))

        assert rendered == original
