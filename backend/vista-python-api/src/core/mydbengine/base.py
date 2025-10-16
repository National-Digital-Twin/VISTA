"""Mydbengine Module."""

import boto3
from django.contrib.gis.db.backends.postgis.base import DatabaseWrapper as BasePostGISWrapper


class DatabaseWrapper(BasePostGISWrapper):
    """Represent a database connection."""

    def __init__(self, settings_dict, *args, **kwargs):
        """Construct a database wrapper."""
        super().__init__({**settings_dict, "PASSWORD": ""}, *args, **kwargs)

    def get_connection_params(self):
        """Return a dict of parameters suitable for get_new_connection."""
        db_host_name = self.settings_dict["HOST"]
        port = self.settings_dict["PORT"]
        db_user_name = self.settings_dict["USER"]
        region = self.settings_dict["REGION"]

        client = boto3.client("rds", region)
        return {
            **super().get_connection_params(),
            "password": client.generate_db_auth_token(db_host_name, port, db_user_name),
        }
