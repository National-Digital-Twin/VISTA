# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the UK's Department for Business, Innovation, Science and Trade (BIST) as the governing entity.

"""vista Backend Application Configuration."""

from django.apps import AppConfig


class ApiConfig(AppConfig):
    """
    Configuration class for the vista Backend Application.

    This class sets the configuration for the 'api' application, including
    the default type of primary key fields and the application name.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "api"
