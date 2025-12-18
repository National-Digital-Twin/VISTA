"""A class representing a user known to an identity provider."""

from dataclasses import dataclass


@dataclass
class IdpUser:
    """A class representing a user known to an identity provider."""

    id: str
    email: str
    name: str | None = None
    enabled: bool = True
    status: str | None = None
    user_since: str | None = None
    user_type: str | None = "General"

    @classmethod
    def from_cognito(cls, data: dict, is_admin: bool) -> "IdpUser":
        """Map AWS Cognito API response into domain model."""
        attrs = {attr["Name"]: attr["Value"] for attr in data.get("Attributes", [])}

        user_create_date = data.get("UserCreateDate")
        user_since = user_create_date.strftime("%Y-%m-%d")
        user_type = "Admin" if is_admin else "General"

        return cls(
            id=data.get("Username"),
            email=attrs.get("email"),
            name=attrs.get("name"),
            enabled=data.get("Enabled", True),
            status=data.get("UserStatus"),
            user_since=user_since,
            user_type=user_type,
        )
