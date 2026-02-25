"""Service methods for data source access."""

from django.db.models import Exists, OuterRef, Q

from api.models import Asset, AssetType, GroupDataSourceAccess, VisibleAsset


def user_can_access_asset(user_id, asset: Asset) -> bool:
    """Return True if the user has access to the asset's type's data source."""
    return not get_asset_types_user_cannot_access(user_id).filter(id=asset.type_id).exists()


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


def cleanup_stale_visible_assets(user_ids):
    """Remove VisibleAsset records for asset types the given users can no longer access."""
    if not user_ids:
        return 0

    data_source_is_restricted = GroupDataSourceAccess.objects.filter(
        data_source=OuterRef("asset_type__data_source"),
    )
    user_has_access = GroupDataSourceAccess.objects.filter(
        data_source=OuterRef("asset_type__data_source"),
        group__members__user_id=OuterRef("focus_area__user_id"),
    )
    deleted_count, _ = (
        VisibleAsset.objects.filter(focus_area__user_id__in=user_ids)
        .filter(Exists(data_source_is_restricted))
        .exclude(Exists(user_has_access))
        .delete()
    )
    return deleted_count
