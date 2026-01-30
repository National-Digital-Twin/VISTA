"""Views for interfacing with application users."""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from api.models.group import GroupMembership
from api.models.user_invite import UserInvite
from api.permissions import Administrator
from api.repository.external.idp_repository import IdpRepository
from api.serializers import IdpUserSerializer, UserCreateSerializer, UserInviteSerializer
from api.utils.auth import get_user_id_from_request


class ApplicationUserViewSet(ViewSet):
    """Views for interfacing with application users."""

    def __init__(self, **kwargs):
        """Construct an instance of `ApplicationUserViewSet`."""
        super().__init__(**kwargs)
        self.idp_repository = IdpRepository()

    def get_permissions(self):
        """Get permissions for viewset methods."""
        return [Administrator()]

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

        user_invite = UserInvite.objects.create(
            user_id=user_id, status="pending", created_by=req_user_id
        )
        self._create_group_memberships(group_ids, user_id, req_user_id)

        return Response(
            UserInviteSerializer(user_invite).data,
            status=status.HTTP_201_CREATED,
        )

    def _create_group_memberships(self, group_ids, user_id, req_user_id):
        """Create group membership from group_ids and user ID."""
        memberships = []
        for group_id in group_ids:
            membership = GroupMembership.create(group_id, user_id, req_user_id)
            memberships.append(membership)

        GroupMembership.objects.bulk_create(memberships)
