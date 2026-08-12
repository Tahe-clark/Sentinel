from channels.generic.websocket import AsyncJsonWebsocketConsumer


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
        """
        For the MVP, Django simply relays signaling
        messages to every connected Sentinel client.

        React clients decide whether a message
        is intended for them.
        """

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