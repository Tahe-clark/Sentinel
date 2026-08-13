from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from devices.models import Device


class SignalingConsumer(AsyncJsonWebsocketConsumer):
    room_name = "sentinel"

    async def connect(self):
        # Au début, cette connexion n'est associée
        # à aucun appareil.
        self.device_key = None

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
        # Si cette connexion appartenait à un emitter,
        # on marque l'appareil offline.
        if self.device_key:
            device = await self.mark_device_offline(
                self.device_key
            )

            if device:
                await self.channel_layer.group_send(
                    self.room_name,
                    {
                        "type": "relay_message",
                        "payload": {
                            "type": "device_offline",
                            "device_id": device["device_key"],
                            "device_name": device["name"],
                            "last_seen": device["last_seen"],
                        },
                    },
                )

        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name,
        )


    async def receive_json(self, content):
        message_type = content.get("type")

        if message_type == "device_online":
            device_key = content.get("device_id")

            if not device_key:
                return

            device = await self.register_or_update_device(
                device_key=device_key,
                name=content.get(
                    "device_name",
                    "Unnamed device",
                ),
            )

            # On associe CE WebSocket à CET appareil.
            self.device_key = device["device_key"]

            content["device_id"] = device["device_key"]
            content["device_name"] = device["name"]
            content["is_active"] = True
            content["last_seen"] = device["last_seen"]

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
        now = timezone.now()

        device, created = Device.objects.get_or_create(
            device_key=device_key,
            defaults={
                "name": name,
                "is_active": True,
                "last_seen": now,
            },
        )

        if not created:
            device.name = name
            device.is_active = True
            device.last_seen = now

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
            "last_seen": device.last_seen.isoformat(),
        }


    @database_sync_to_async
    def mark_device_offline(
        self,
        device_key,
    ):
        try:
            device = Device.objects.get(
                device_key=device_key
            )
        except Device.DoesNotExist:
            return None

        device.is_active = False
        device.last_seen = timezone.now()

        device.save(
            update_fields=[
                "is_active",
                "last_seen",
            ]
        )

        return {
            "device_key": device.device_key,
            "name": device.name,
            "last_seen": device.last_seen.isoformat(),
        }