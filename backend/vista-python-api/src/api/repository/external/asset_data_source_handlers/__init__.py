# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

"""A handler registry for all data source types."""

from .cqc_data_source_handler import CqcDataSourceHandler
from .naptan_data_source_handler import NaptanDataSourceHandler
from .national_grid_data_source_handler import NationalGridDataSourceHandler
from .nhs_data_source_handler import NhsDataSourceHandler
from .os_names_data_source_handler import OsNamesDataSourceHandler
from .os_ngd_data_source_handler import OsNgdDataSourceHandler

handler_registry = {
    "cqc": CqcDataSourceHandler("Isle of Wight"),
    "naptan": NaptanDataSourceHandler("230"),
    "national_grid": NationalGridDataSourceHandler("(-1.824417, 50.532539, -0.780029, 50.829)"),
    "nhs": NhsDataSourceHandler(""),
    "os_names": OsNamesDataSourceHandler("425000,80000,470000,97000"),
    "os_ngd": OsNgdDataSourceHandler("-1.585464,50.562959,-0.926285,50.761219"),
}
