# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""An identity provider repository."""

import logging
from datetime import UTC, datetime
from typing import ClassVar

import boto3
from django.conf import settings

from api.domain.cognito_user import IdpUser
from api.repository.external.email_repository import EmailRepository
from api.utils.auth import generate_temp_password

logger = logging.getLogger(__name__)


class IdpRepository:
    """An identity provider repository."""

    user_pool_id: ClassVar[str] = settings.COGNITO_USER_POOL_ID
    user_group_name: ClassVar[str] = settings.COGNITO_MAIN_USER_GROUP_NAME
    admin_user_group_name: ClassVar[str] = settings.COGNITO_ADMIN_USER_GROUP_NAME

    def __init__(self):
        """Construct an instance."""
        self.client = boto3.client("cognito-idp", region_name=settings.REGION)
        self.email_repository = EmailRepository()

    def _stub_users(self):
        return [
            {
                "Username": "7b225422-5d6a-4b83-9655-4bdbe8443c5f",
                "Attributes": [
                    {"Name": "email", "Value": "local.user@example.com"},
                    {"Name": "name", "Value": "Local User"},
                ],
                "UserCreateDate": datetime.now(UTC),
                "UserStatus": "Confirmed",
            },
            {
                "Username": "8fd4bdcb-5823-4c9b-a16d-82b680fdd05e",
                "Attributes": [
                    {"Name": "email", "Value": "local.user2@example.com"},
                    {"Name": "name", "Value": "Local User2"},
                ],
                "UserCreateDate": datetime.now(UTC),
                "UserStatus": "Confirmed",
            },
            {
                "Username": "00000000-0000-0000-0000-000000000001",
                "Attributes": [
                    {"Name": "email", "Value": "dev.user@example.com"},
                    {"Name": "name", "Value": "Dev User"},
                ],
                "UserCreateDate": datetime.now(UTC),
                "UserStatus": "Confirmed",
            },
        ]

    def get_user_by_email(self, email) -> IdpUser | None:
        """Get a user by their email address, if they exist."""
        response = self.client.list_users(
            UserPoolId=self.user_pool_id,
            Filter=f'email = "{email}"',
            Limit=1,
        )
        if len(response["Users"]):
            user = response["Users"][0]
            admins = self.get_admin_user_list()
            return IdpUser.from_cognito(user, user.get("Username") in admins)
        return None

    def get_user_by_id(self, user_id) -> IdpUser | None:
        """Get a user by their user ID, if they exist."""
        response = self.client.list_users(
            UserPoolId=self.user_pool_id,
            Filter=f'sub = "{user_id}"',
            Limit=1,
        )
        if len(response["Users"]):
            user = response["Users"][0]
            admins = self.get_admin_user_list()
            return IdpUser.from_cognito(user, user.get("Username") in admins)
        return None

    def get_all_users(self, page_size=60):
        """Get all users in pool through pagination."""
        paginator = self.client.get_paginator("list_users")

        users = []
        for page in paginator.paginate(
            UserPoolId=self.user_pool_id,
            PaginationConfig={"PageSize": page_size},
        ):
            users.extend(page.get("Users", []))

        return users

    def get_all_users_in_group(self, group_name, page_size=60):
        """Get all users in group through pagination."""
        paginator = self.client.get_paginator("list_users_in_group")

        users = []
        for page in paginator.paginate(
            UserPoolId=self.user_pool_id,
            GroupName=group_name,
            PaginationConfig={"PageSize": page_size},
        ):
            users.extend(page.get("Users", []))

        return users

    def get_admin_user_list(self):
        """Get a list of admin usernames."""
        admins = self.get_all_users_in_group(self.admin_user_group_name)
        return [admin.get("Username") for admin in admins]

    def list_users_in_group(self) -> list[IdpUser]:
        """Get a list of users known to the identity provider for the application group."""
        if not settings.IS_PROD:
            return [
                IdpUser.from_cognito(user, bool(int(user["Username"][0]) % 2))
                for user in self._stub_users()
            ]
        all_users = self.get_all_users_in_group(self.user_group_name)
        admins = self.get_admin_user_list()
        return [IdpUser.from_cognito(user, user.get("Username") in admins) for user in all_users]

    def list_all_users(self) -> list[IdpUser]:
        """Get a list of all users known to the identity provider."""
        if not settings.IS_PROD:
            return [
                IdpUser.from_cognito(user, bool(int(user["Username"][0]) % 2))
                for user in self._stub_users()
            ]
        all_users = self.get_all_users()
        admins = self.get_admin_user_list()
        return [IdpUser.from_cognito(user, user.get("Username") in admins) for user in all_users]

    def get_user_name_map(self) -> dict[str, str]:
        """Return a user_id -> name mapping for all users."""
        try:
            users = self.list_users_in_group()
            return {user.id: user.name for user in users}
        except Exception:
            logger.exception("Failed to fetch users from identity provider")
            return {}

    def create_user(self, email, is_admin) -> str:
        """Create a new user."""
        if not settings.IS_PROD:
            return "00000000-0000-0000-0000-000000000001"
        user_attrs = [{"Name": "email", "Value": email}]
        existing_user = self.get_user_by_email(email)
        username = ""

        if existing_user:
            username = existing_user.id
            self.email_repository.send_added_email(email)
        else:
            response = self.client.admin_create_user(
                UserPoolId=self.user_pool_id,
                Username=email,
                UserAttributes=user_attrs,
                TemporaryPassword=generate_temp_password(),
            )
            username = response["User"]["Username"]

        self._add_user_to_user_group(username)
        if is_admin:
            self._add_user_to_admin_group(username)
        return username

    def resend_user_invite(self, user_id: str) -> None:
        """Resend a user invite."""
        user = self.get_user_by_id(user_id)
        self.email_repository.send_added_email(user.email)

    def remove_user_from_vista(self, user_id: str) -> None:
        """Remove user access to VISTA."""
        self.client.admin_remove_user_from_group(
            UserPoolId=self.user_pool_id, Username=user_id, GroupName=self.user_group_name
        )
        self.client.admin_remove_user_from_group(
            UserPoolId=self.user_pool_id, Username=user_id, GroupName=self.admin_user_group_name
        )

    def _add_user_to_user_group(self, username):
        self.client.admin_add_user_to_group(
            UserPoolId=self.user_pool_id, Username=username, GroupName=self.user_group_name
        )

    def _add_user_to_admin_group(self, username):
        self.client.admin_add_user_to_group(
            UserPoolId=self.user_pool_id, Username=username, GroupName=self.admin_user_group_name
        )
