"""A handler registry for all data source types."""

from .cqc_data_source_handler import CqcDataSourceHandler
from .naptan_data_source_handler import NaptanDataSourceHandler
from .nhs_data_source_handler import NhsDataSourceHandler
from .os_names_data_source_handler import OsNamesDataSourceHandler
from .os_ngd_data_source_handler import OsNgdDataSourceHandler

handler_registry = {
    "cqc": CqcDataSourceHandler("Isle of Wight"),
    "nhs": NhsDataSourceHandler(""),
    "naptan": NaptanDataSourceHandler("230"),
    "os_names": OsNamesDataSourceHandler("425000,80000,470000,97000"),
    "os_ngd": OsNgdDataSourceHandler("-1.585464,50.562959,-0.926285,50.761219"),
}
