"""Register your models here."""

from django.contrib import admin

from api.models import LowBridge, SandbagPlacement, TrafficData, VulnerablePerson

# Register your models here.
admin.site.register(TrafficData)
admin.site.register(VulnerablePerson)
admin.site.register(SandbagPlacement)
admin.site.register(LowBridge)
