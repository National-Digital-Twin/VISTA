"""Deletes the defunct low bridges dataset."""

from typing import ClassVar

from django.db import migrations


class Migration(migrations.Migration):
    """Deletes the defunct low bridges dataset."""

    dependencies: ClassVar = [
        ("api", "0015_delete_sandbagplacement_delete_vulnerableperson"),
    ]

    operations: ClassVar = [
        migrations.DeleteModel(
            name="LowBridge",
        ),
    ]
