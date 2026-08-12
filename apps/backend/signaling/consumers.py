from channels.generic.websocket import AsyncJsonWebsocketConsumer


class SignalingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = "sentinel"

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
            await self.channel_layer.group_send(
                self.room_name,
                {
                    "type": "device_online_message",
                    "device_name": content.get(
                        "device_name",
                        "Unknown device",
                    ),
                },
            )

    async def device_online_message(self, event):
        await self.send_json({
            "type": "device_online",
            "device_name": event["device_name"],
        })