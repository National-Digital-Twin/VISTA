"""Test cases for the refresh data management command."""

from api.management.commands.refresh_data import Command


def test_refresh_data_command_runs_successfully():
    """Test that the refresh data command runs successfully."""
    command = Command()
    command.handle()
