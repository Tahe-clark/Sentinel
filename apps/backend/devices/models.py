from django.db import models
from django.conf import settings

class Device(models.Model):
    owner = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="devices",
    null=True,
    blank=True,
)

    name = models.CharField(
        max_length=100
    )

    device_key = models.CharField(
        max_length=100,
        unique=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    last_seen = models.DateTimeField(
        null=True,
        blank=True
    )

    is_active = models.BooleanField(
        default=False
    )

    is_paired = models.BooleanField(
        default=False
    )

    def __str__(self):
        return self.name


class PairingRequest(models.Model):
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name="pairing_requests",
    )

    code = models.CharField(
        max_length=6,
        unique=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    expires_at = models.DateTimeField()

    claimed = models.BooleanField(
        default=False
    )

    def __str__(self):
        return f"{self.device.name} - {self.code}"