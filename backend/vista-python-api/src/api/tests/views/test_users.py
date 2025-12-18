"""A set of tests for the `ApplictionUserViewSet`."""

user_a = {
    "id": "abc",
    "email": "test@example.com",
    "name": "John Doe",
    "enabled": True,
    "status": "CONFIRMED",
    "user_since": "2022-02-20",
    "user_type": "Admin",
}

http_success_code = 200


class MockIdpRepository:
    """Mockable IdpRepository class."""

    def __init__(self):
        """Construct an instance of `MockIdpRepository`."""

    def list_users_in_group(self):
        """List a set of users."""
        return [user_a]


def test_list_users(client, monkeypatch):
    """Test that the list function works as expected."""
    monkeypatch.setattr("api.views.users.IdpRepository", MockIdpRepository)
    response = client.get("/api/users/")

    assert response.status_code == http_success_code
    assert response.data == [user_a]
