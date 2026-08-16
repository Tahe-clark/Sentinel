from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from django.contrib.auth.hashers import check_password
from django.utils import timezone

from devices.models import Device


class SignalingConsumer(
    AsyncJsonWebsocketConsumer
):
    async def connect(self):
        self.role = (
            self.scope[
                "url_route"
            ]["kwargs"].get(
                "role"
            )
        )

        self.device_key = None
        self.owner_id = None
        self.user_group = None
        self.device_group = None


        if self.role == "dashboard":
            user = self.scope["user"]


            if not user.is_authenticated:
                await self.close(
                    code=4401
                )

                return


            self.owner_id = user.id

            self.user_group = (
                self.make_user_group(
                    user.id
                )
            )


            await self.channel_layer.group_add(
                self.user_group,
                self.channel_name,
            )


        elif self.role == "emitter":
            pass


        else:
            await self.close(
                code=4400
            )

            return


        await self.accept()


        await self.send_json({
            "type":
                "connection_established",

            "role":
                self.role,
        })


    async def disconnect(
        self,
        close_code,
    ):
        if self.user_group:
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name,
            )


        if self.device_group:
            await self.channel_layer.group_discard(
                self.device_group,
                self.channel_name,
            )


        if (
            self.role == "emitter"
            and self.device_key
        ):
            device = (
                await self.mark_device_offline(
                    self.device_key
                )
            )


            if (
                device
                and self.user_group
            ):
                await self.channel_layer.group_send(
                    self.user_group,
                    {
                        "type":
                            "signaling.message",

                        "payload": {
                            "type":
                                "device_offline",

                            "device_id":
                                device[
                                    "device_key"
                                ],

                            "device_name":
                                device[
                                    "name"
                                ],

                            "last_seen":
                                device[
                                    "last_seen"
                                ],
                        },
                    },
                )


    async def receive_json(
        self,
        content,
    ):
        if self.role == "dashboard":
            await self.handle_dashboard_message(
                content
            )

            return


        if self.role == "emitter":
            await self.handle_emitter_message(
                content
            )

            return


    async def handle_dashboard_message(
        self,
        content,
    ):
        message_type = content.get(
            "type"
        )


        allowed_messages = {
            "watch_device",
            "webrtc_answer",
            "ice_candidate",
        }


        if (
            message_type
            not in allowed_messages
        ):
            return


        target_device_id = (
            content.get(
                "target_device_id"
            )
        )


        if not target_device_id:
            return


        user = self.scope["user"]


        owns_device = (
            await self.user_owns_device(
                user.id,
                target_device_id,
            )
        )


        if not owns_device:
            await self.send_json({
                "type":
                    "authorization_error",

                "message":
                    "You do not own this device.",
            })

            return


        await self.channel_layer.group_send(
            self.user_group,
            {
                "type":
                    "signaling.message",

                "payload":
                    content,
            },
        )


    async def handle_emitter_message(
        self,
        content,
    ):
        message_type = content.get(
            "type"
        )


        if message_type == "device_online":
            await self.authenticate_device(
                content
            )

            return


        if not self.device_key:
            await self.send_json({
                "type":
                    "device_authentication_error",

                "message":
                    "Device is not authenticated.",
            })

            return


        if (
            content.get("device_id")
            != self.device_key
        ):
            return


        allowed_messages = {
            "camera_ready",
            "camera_stopped",
            "camera_unavailable",
            "webrtc_offer",
            "ice_candidate",
        }


        if (
            message_type
            not in allowed_messages
        ):
            return


        if not self.user_group:
            return


        await self.channel_layer.group_send(
            self.user_group,
            {
                "type":
                    "signaling.message",

                "payload":
                    content,
            },
        )


    async def authenticate_device(
        self,
        content,
    ):
        device_key = content.get(
            "device_id"
        )

        device_name = content.get(
            "device_name",
            "Unnamed device",
        )

        device_token = content.get(
            "device_token"
        )


        if (
            not device_key
            or not device_token
        ):
            await self.send_json({
                "type":
                    "device_authentication_error",

                "message":
                    "Device credentials are missing.",
            })

            return


        device = await self.verify_device(
            device_key,
            device_token,
            device_name,
        )


        if not device:
            await self.send_json({
                "type":
                    "device_authentication_error",

                "message":
                    "Invalid device credentials.",
            })

            return


        self.device_key = (
            device["device_key"]
        )

        self.owner_id = (
            device["owner_id"]
        )


        self.device_group = (
            self.make_device_group(
                self.device_key
            )
        )


        await self.channel_layer.group_add(
            self.device_group,
            self.channel_name,
        )


        if (
            device["is_paired"]
            and self.owner_id
        ):
            self.user_group = (
                self.make_user_group(
                    self.owner_id
                )
            )


            await self.channel_layer.group_add(
                self.user_group,
                self.channel_name,
            )


            await self.channel_layer.group_send(
                self.user_group,
                {
                    "type":
                        "signaling.message",

                    "payload": {
                        "type":
                            "device_online",

                        "device_id":
                            device[
                                "device_key"
                            ],

                        "device_name":
                            device[
                                "name"
                            ],

                        "is_active":
                            True,

                        "is_paired":
                            True,

                        "last_seen":
                            device[
                                "last_seen"
                            ],
                    },
                },
            )


        await self.send_json({
            "type":
                "device_authenticated",

            "device_id":
                self.device_key,

            "paired":
                device[
                    "is_paired"
                ],

            "owner":
                device[
                    "owner"
                ],
        })


    async def pairing_completed(
        self,
        event,
    ):
        if (
            event.get("device_key")
            != self.device_key
        ):
            return


        owner = event.get(
            "owner"
        )


        if not owner:
            return


        self.owner_id = (
            owner["id"]
        )


        self.user_group = (
            self.make_user_group(
                self.owner_id
            )
        )


        await self.channel_layer.group_add(
            self.user_group,
            self.channel_name,
        )


        await self.send_json({
            "type":
                "pairing_completed",

            "device_id":
                self.device_key,

            "owner":
                owner,
        })


        device = (
            await self.get_device_info(
                self.device_key
            )
        )


        if device:
            await self.channel_layer.group_send(
                self.user_group,
                {
                    "type":
                        "signaling.message",

                    "payload": {
                        "type":
                            "device_online",

                        "device_id":
                            device[
                                "device_key"
                            ],

                        "device_name":
                            device[
                                "name"
                            ],

                        "is_active":
                            True,

                        "is_paired":
                            True,

                        "last_seen":
                            device[
                                "last_seen"
                            ],
                    },
                },
            )


    async def device_management(
        self,
        event,
    ):
        action = event.get(
            "action"
        )

        payload = event.get(
            "payload",
            {}
        )


        if action == "unpair":
            if self.user_group:
                await self.channel_layer.group_discard(
                    self.user_group,
                    self.channel_name,
                )


            self.user_group = None
            self.owner_id = None


            await self.send_json(
                payload
            )

            return


        if action == "delete":
            if self.user_group:
                await self.channel_layer.group_discard(
                    self.user_group,
                    self.channel_name,
                )


            if self.device_group:
                await self.channel_layer.group_discard(
                    self.device_group,
                    self.channel_name,
                )


            self.user_group = None
            self.device_group = None
            self.owner_id = None
            self.device_key = None


            await self.send_json(
                payload
            )

            return


    async def signaling_message(
        self,
        event,
    ):
        await self.send_json(
            event["payload"]
        )


    def make_user_group(
        self,
        user_id,
    ):
        return f"user.{user_id}"


    def make_device_group(
        self,
        device_key,
    ):
        return f"device.{device_key}"


    @database_sync_to_async
    def verify_device(
        self,
        device_key,
        device_token,
        device_name,
    ):
        try:
            device = (
                Device.objects
                .select_related("owner")
                .get(
                    device_key=device_key
                )
            )

        except Device.DoesNotExist:
            return None


        if not device.auth_token_hash:
            return None


        valid = check_password(
            device_token,
            device.auth_token_hash,
        )


        if not valid:
            return None


        device.name = device_name
        device.is_active = True
        device.last_seen = timezone.now()


        device.save(
            update_fields=[
                "name",
                "is_active",
                "last_seen",
            ]
        )


        owner = None


        if device.owner:
            owner = {
                "id":
                    device.owner.id,

                "username":
                    device.owner.username,

                "email":
                    device.owner.email,
            }


        return {
            "device_key":
                device.device_key,

            "name":
                device.name,

            "owner_id":
                device.owner_id,

            "owner":
                owner,

            "is_paired":
                device.is_paired,

            "last_seen":
                device
                .last_seen
                .isoformat(),
        }


    @database_sync_to_async
    def user_owns_device(
        self,
        user_id,
        device_key,
    ):
        return (
            Device.objects
            .filter(
                owner_id=user_id,
                device_key=device_key,
                is_paired=True,
            )
            .exists()
        )


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
            "device_key":
                device.device_key,

            "name":
                device.name,

            "last_seen":
                device
                .last_seen
                .isoformat(),
        }


    @database_sync_to_async
    def get_device_info(
        self,
        device_key,
    ):
        try:
            device = Device.objects.get(
                device_key=device_key
            )

        except Device.DoesNotExist:
            return None


        return {
            "device_key":
                device.device_key,

            "name":
                device.name,

            "last_seen": (
                device.last_seen.isoformat()
                if device.last_seen
                else None
            ),
        }