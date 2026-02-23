"""Service methods for data source access."""

from django.db.models import Exists, OuterRef, Q

from api.models import AssetType, GroupDataSourceAccess


def get_asset_types_user_can_access(user_id):
    """Get the asset types which a user can access."""
    base_query = _get_asset_type_query_with_annotations(user_id)
    return base_query.filter(Q(has_any_group_access=False) | Q(has_user_membership=True))


def get_asset_types_user_cannot_access(user_id):
    """Get the asset types which a user cannot access."""
    base_query = _get_asset_type_query_with_annotations(user_id)
    return base_query.filter(
        has_any_group_access=True,
        has_user_membership=False,
    )


def _get_asset_type_query_with_annotations(user_id):
    data_source_has_any_group_access = _get_data_source_has_any_group_access()
    data_source_has_user_membership = _get_data_source_has_user_membership(user_id)
    return AssetType.objects.select_related("sub_category__category", "data_source").annotate(
        has_any_group_access=Exists(data_source_has_any_group_access),
        has_user_membership=Exists(data_source_has_user_membership),
    )


def _get_data_source_has_any_group_access():
    return GroupDataSourceAccess.objects.filter(data_source=OuterRef("data_source"))


def _get_data_source_has_user_membership(user_id):
    return GroupDataSourceAccess.objects.filter(
        data_source=OuterRef("data_source"),
        group__members__user_id=user_id,
    )
