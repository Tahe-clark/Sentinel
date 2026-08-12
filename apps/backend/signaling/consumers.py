from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from devices.models import Device


class SignalingConsumer(AsyncJsonWebsocketConsumer):
    room_name = "sentinel"

    async def connect(self):
        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name,
        )

        await self.accept()

        await self.send_json({
            "type": "connection_established",
            "message": "Connected to Sentinel signaling server",
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name,
        )

    async def receive_json(self, content):
        message_type = content.get("type")

        if message_type == "device_online":
            device = await self.register_or_update_device(
                device_key=content.get("device_id"),
                name=content.get(
                    "device_name",
                    "Unnamed device",
                ),
            )

            content["device_id"] = device["device_key"]
            content["device_name"] = device["name"]
            content["is_active"] = True

        await self.channel_layer.group_send(
            self.room_name,
            {
                "type": "relay_message",
                "payload": content,
            },
        )

    async def relay_message(self, event):
        await self.send_json(
            event["payload"]
        )

    @database_sync_to_async
    def register_or_update_device(
        self,
        device_key,
        name,
    ):
        device, created = Device.objects.get_or_create(
            device_key=device_key,
            defaults={
                "name": name,
                "is_active": True,
                "last_seen": timezone.now(),
            },
        )

        if not created:
            device.name = name
            device.is_active = True
            device.last_seen = timezone.now()

            device.save(
                update_fields=[
                    "name",
                    "is_active",
                    "last_seen",
                ]
            )

        return {
            "id": device.id,
            "device_key": device.device_key,
            "name": device.name,
        }