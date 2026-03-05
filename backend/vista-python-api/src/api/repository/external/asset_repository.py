# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""Fetch live data and return assets."""

from api.repository.external.asset_data_source_handlers import handler_registry


async def fetch(asset_specification):
    """Fetch live data and return assets."""
    handler = handler_registry.get(asset_specification["source"])
    if not handler:
        raise ValueError(f"No handler found for source '{asset_specification['source']}'")

    urls = handler.build_urls_for_data_source(asset_specification)
    all_assets = []

    for url in urls:
        assets = await handler.fetch_data_for_asset_specification(asset_specification, url)
        all_assets.extend(assets)

    return all_assets
