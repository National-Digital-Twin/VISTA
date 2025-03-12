"""Alter `trafficdata`.`coordinates` to be non-nullable, default to empty string."""

from typing import ClassVar

from django.db import migrations, models


class Migration(migrations.Migration):
    """Alter `trafficdata`.`coordinates` to be non-nullable, default to empty string."""

    dependencies: ClassVar = [
        ("api", "0013_metricate_envelope_restrictions"),
    ]

    operations: ClassVar = [
        migrations.AlterField(
            model_name="trafficdata",
            name="coordinates",
            field=models.CharField(blank=True, default="", max_length=255),
            preserve_default=False,
        ),
    ]
