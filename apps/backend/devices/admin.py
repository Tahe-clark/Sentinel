from django.contrib import admin

from .models import Device, PairingRequest


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "device_key",
        "is_active",
        "is_paired",
        "last_seen",
        "created_at",
    )


@admin.register(PairingRequest)
class PairingRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "device",
        "code",
        "claimed",
        "created_at",
        "expires_at",
    )