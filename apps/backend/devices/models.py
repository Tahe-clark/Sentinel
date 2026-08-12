from django.db import models


class Device(models.Model):
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

    def __str__(self):
        return self.name