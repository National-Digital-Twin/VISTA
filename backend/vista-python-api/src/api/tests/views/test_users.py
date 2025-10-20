"""A set of tests for the `ApplictionUserViewSet`."""

import json

from api.views.users import ApplicationUserViewSet

user_a = {
    "id": "abc",
    "email": "test@example.com",
    "name": "John Doe",
    "enabled": True,
    "status": "CONFIRMED",
}

http_success_code = 200


class MockIdpRepository:
    """Mockable IdpRepository class."""

    def __init__(self):
        """Construct an instance of `MockIdpRepository`."""

    def list_users(self):
        """List a set of users."""
        return [user_a]


def test_list_users():
    """Test that the list function works as expected."""
    view = ApplicationUserViewSet(idp_repository=MockIdpRepository())
    response = view.list(None)

    assert response.status_code == http_success_code
    assert response.text == json.dumps([user_a])
