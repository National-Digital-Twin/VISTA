"""Views for interfacing with application users."""

import logging
from datetime import UTC, datetime, timedelta

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from api.models.group import GroupMembership
from api.models.user_invite import UserInvite
from api.permissions import Administrator
from api.repository.external.idp_repository import IdpRepository
from api.serializers import IdpUserSerializer, UserCreateSerializer, UserInviteSerializer
from api.utils.auth import get_user_id_from_request


class ApplicationUserViewSet(ModelViewSet):
    """Views for interfacing with application users."""

    logger = logging.getLogger(__name__)

    def __init__(self, **kwargs):
        """Construct an instance of `ApplicationUserViewSet`."""
        super().__init__(**kwargs)
        self.idp_repository = IdpRepository()

    def get_permissions(self):
        """Get permissions for viewset methods."""
        return [Administrator()]

    def get_serializer_class(self):
        """Fetch the correct response serializer for endpoint."""
        if self.action in ["list_invites", "create"]:
            return UserInviteSerializer
        return IdpUserSerializer

    def get_serializer_context(self):
        """Get external user context for serializer."""
        context = super().get_serializer_context()
        idp_users = self.idp_repository.list_users_in_group()
        context["idp_user_map"] = {idp_user.id: idp_user for idp_user in idp_users}
        return context

    def list(self, _request):
        """Return a list of all users."""
        users = self.idp_repository.list_users_in_group()
        serializer = IdpUserSerializer(users, many=True)
        return Response(serializer.data)

    def create(self, request):
        """Create a user in Cognito and invite and group membership records."""
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        req_user_id = get_user_id_from_request(request)

        email = serializer.validated_data["email"]
        user_type = serializer.validated_data["user_type"]
        group_ids = serializer.validated_data.get("group_ids")
        user_id = self.idp_repository.create_user(email, user_type == "admin")

        existing_user_invite = UserInvite.objects.filter(user_id=user_id)
        if len(existing_user_invite) > 0:
            return Response(
                {"detail": "Account already exists for user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_invite = UserInvite.objects.create(
            user_id=user_id, status="pending", created_by=req_user_id
        )
        self._create_group_memberships(group_ids, user_id, req_user_id)

        serializer = self.get_serializer(user_invite)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk):  # noqa: ARG002
        """Delete user from vista Cognito groups and user-associated entities."""
        self.idp_repository.remove_user_from_vista(pk)
        UserInvite.objects.filter(user_id=pk).delete()
        GroupMembership.objects.filter(user_id=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"], url_path="resolve-invites")
    def resolve_invites(self, request):
        """Resolve any pending user invites."""
        req_user_id = get_user_id_from_request(request)
        self._check_accept_current_user_invite(req_user_id)
        self._check_all_pending_invites_for_expiry()
        return Response(status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="pending-invites")
    def list_invites(self, request):  # noqa: ARG002
        """Fetch any pending or expired user invites."""
        user_invites = UserInvite.objects.filter(
            status__in=[UserInvite.PENDING, UserInvite.EXPIRED]
        )
        serializer = self.get_serializer(user_invites, many=True)
        return Response(serializer.data)

    def _check_accept_current_user_invite(self, user_id):
        try:
            user_invite = UserInvite.objects.get(user_id=user_id)
            if user_invite.status == "pending" and not self._is_invite_expired(user_invite):
                user_invite.status = "accepted"
                user_invite.accepted_at = datetime.now(UTC)
                user_invite.save()
        except UserInvite.DoesNotExist:
            self.logger.info("User with ID % not found.", user_id)

    def _check_all_pending_invites_for_expiry(self):
        pending_invites = UserInvite.objects.filter(status="pending")
        for invite in pending_invites:
            if self._is_invite_expired(invite):
                invite.status = "expired"
                invite.expired_at = datetime.now(UTC)
                invite.save()
                self.idp_repository.remove_user_from_vista(str(invite.user_id))

    def _is_invite_expired(self, user_invite):
        return datetime.now(UTC) > user_invite.created_at + timedelta(days=7)

    def _create_group_memberships(self, group_ids, user_id, req_user_id):
        """Create group membership from group_ids and user ID."""
        memberships = []
        for group_id in group_ids:
            membership = GroupMembership.create(group_id, user_id, req_user_id)
            memberships.append(membership)

        GroupMembership.objects.bulk_create(memberships)
