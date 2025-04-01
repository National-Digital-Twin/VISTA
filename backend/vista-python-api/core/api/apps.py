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
