"""Register your models here."""

from django.contrib import admin

from api.models import LowBridge, TrafficData

# Register your models here.
admin.site.register(TrafficData)
admin.site.register(LowBridge)
