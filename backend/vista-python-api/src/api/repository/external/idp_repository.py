"""An identity provider repository."""

from datetime import UTC, datetime
from typing import ClassVar

import boto3
from django.conf import settings

from api.domain.cognito_user import IdpUser


class IdpRepository:
    """An identity provider repository."""

    user_pool_id: ClassVar[str] = settings.COGNITO_USER_POOL_ID
    user_group_name: ClassVar[str] = settings.COGNITO_MAIN_USER_GROUP_NAME
    admin_user_group_name: ClassVar[str] = settings.COGNITO_ADMIN_USER_GROUP_NAME

    def __init__(self):
        """Construct an instance."""
        self.client = boto3.client("cognito-idp", region_name=settings.REGION)

    def _stub_users(self):
        return [
            {
                "Username": "1",
                "Attributes": [
                    {"Name": "email", "Value": "local.user@example.com"},
                    {"Name": "name", "Value": "Local User"},
                ],
                "UserCreateDate": datetime.now(UTC),
                "UserStatus": "Confirmed",
            },
            {
                "Username": "2",
                "Attributes": [
                    {"Name": "email", "Value": "local.user2@example.com"},
                    {"Name": "name", "Value": "Local User2"},
                ],
                "UserCreateDate": datetime.now(UTC),
                "UserStatus": "Confirmed",
            },
        ]

    def list_users_in_group(self) -> list[IdpUser]:
        """Get a list of users known to the identity provider."""
        if not settings.IS_PROD:
            return [
                IdpUser.from_cognito(user, int(user["Username"]) % 2) for user in self._stub_users()
            ]
        all_user_response = self.client.list_users_in_group(
            UserPoolId=self.user_pool_id, GroupName=self.user_group_name
        )
        admin_user_response = self.client.list_users_in_group(
            UserPoolId=self.user_pool_id, GroupName=self.admin_user_group_name
        )
        admins = [user.get("Username") for user in admin_user_response["Users"]]
        return [
            IdpUser.from_cognito(user, user.get("Username") in admins)
            for user in all_user_response["Users"]
        ]
