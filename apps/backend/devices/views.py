import secrets
from datetime import timedelta

from asgiref.sync import async_to_sync

from channels.layers import get_channel_layer

from django.contrib.auth.hashers import (
    check_password,
    make_password,
)
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Device, PairingRequest
from .serializers import DeviceSerializer


def owner_payload(owner):
    if owner is None:
        return None

    return {
        "id": owner.id,
        "username": owner.username,
        "email": owner.email,
    }


class DeviceListView(ListAPIView):
    serializer_class = DeviceSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            Device.objects
            .filter(
                owner=self.request.user,
                is_paired=True,
            )
            .order_by("name")
        )


class CreatePairingRequestView(APIView):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        device_key = str(
            request.data.get(
                "device_id",
                ""
            )
        ).strip()

        device_name = str(
            request.data.get(
                "device_name",
                ""
            )
        ).strip()

        device_token = str(
            request.data.get(
                "device_token",
                ""
            )
        ).strip()


        if not device_key:
            return Response(
                {
                    "error":
                        "device_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if not device_name:
            return Response(
                {
                    "error":
                        "device_name is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if not device_token:
            return Response(
                {
                    "error":
                        "device_token is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        device = Device.objects.filter(
            device_key=device_key
        ).first()


        if device is None:
            device = Device.objects.create(
                device_key=device_key,
                name=device_name,
                auth_token_hash=make_password(
                    device_token
                ),
                is_active=False,
                is_paired=False,
            )

        else:
            # Compatibilité avec les appareils créés
            # avant l'ajout du token d'appareil.
            if not device.auth_token_hash:
                device.auth_token_hash = (
                    make_password(
                        device_token
                    )
                )

                device.save(
                    update_fields=[
                        "auth_token_hash",
                    ]
                )

            else:
                valid_token = check_password(
                    device_token,
                    device.auth_token_hash,
                )

                if not valid_token:
                    return Response(
                        {
                            "error":
                                "Invalid device credentials."
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )


            device.name = device_name

            device.save(
                update_fields=[
                    "name",
                ]
            )


        if device.is_paired:
            device_with_owner = (
                Device.objects
                .select_related("owner")
                .get(pk=device.pk)
            )

            return Response({
                "paired": True,

                "message":
                    "This device is already paired.",

                "owner":
                    owner_payload(
                        device_with_owner.owner
                    ),
            })


        if device.owner_id is not None:
            return Response(
                {
                    "error":
                        "Device is still assigned to an account."
                },
                status=status.HTTP_409_CONFLICT,
            )


        PairingRequest.objects.filter(
            device=device,
            claimed=False,
        ).delete()


        code = self.generate_unique_code()

        expires_at = (
            timezone.now()
            + timedelta(minutes=5)
        )


        PairingRequest.objects.create(
            device=device,
            code=code,
            expires_at=expires_at,
        )


        return Response(
            {
                "paired": False,

                "code":
                    code,

                "expires_at":
                    expires_at.isoformat(),

                "owner":
                    None,
            },
            status=status.HTTP_201_CREATED,
        )


    def generate_unique_code(self):
        while True:
            code = str(
                secrets.randbelow(
                    900000
                )
                + 100000
            )

            # code est unique dans toute la table,
            # pas uniquement parmi les codes actifs.
            exists = PairingRequest.objects.filter(
                code=code
            ).exists()

            if not exists:
                return code


class ClaimPairingRequestView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]


    @transaction.atomic
    def post(self, request):
        code = str(
            request.data.get(
                "code",
                ""
            )
        ).strip()


        if not code:
            return Response(
                {
                    "error":
                        "Pairing code is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        try:
            pairing_request = (
                PairingRequest.objects
                .select_for_update()
                .select_related(
                    "device"
                )
                .get(
                    code=code,
                    claimed=False,
                )
            )

        except PairingRequest.DoesNotExist:
            return Response(
                {
                    "error":
                        "Invalid pairing code."
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        if (
            pairing_request.expires_at
            <= timezone.now()
        ):
            return Response(
                {
                    "error":
                        "Pairing code has expired."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        device = pairing_request.device


        if device.is_paired:
            return Response(
                {
                    "error":
                        "Device is already paired."
                },
                status=status.HTTP_409_CONFLICT,
            )


        if device.owner_id is not None:
            return Response(
                {
                    "error":
                        "Device already belongs to an account."
                },
                status=status.HTTP_409_CONFLICT,
            )


        device.owner = request.user
        device.is_paired = True

        device.save(
            update_fields=[
                "owner",
                "is_paired",
            ]
        )


        pairing_request.claimed = True

        pairing_request.save(
            update_fields=[
                "claimed",
            ]
        )


        channel_layer = get_channel_layer()


        # Informe l'Emitter connecté.
        async_to_sync(
            channel_layer.group_send
        )(
            f"device.{device.device_key}",
            {
                "type":
                    "pairing.completed",

                "device_key":
                    device.device_key,

                "owner": {
                    "id":
                        request.user.id,

                    "username":
                        request.user.username,

                    "email":
                        request.user.email,
                },
            },
        )


        serializer = DeviceSerializer(
            device
        )


        return Response({
            "message":
                "Device paired successfully.",

            "device":
                serializer.data,

            "owner": {
                "id":
                    request.user.id,

                "username":
                    request.user.username,

                "email":
                    request.user.email,
            },
        })


class UnpairDeviceView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]


    def post(
        self,
        request,
        device_key,
    ):
        try:
            device = (
                Device.objects
                .select_related("owner")
                .get(
                    device_key=device_key,
                    owner=request.user,
                    is_paired=True,
                )
            )

        except Device.DoesNotExist:
            return Response(
                {
                    "error":
                        "Device not found or you do not own it."
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        old_owner_id = request.user.id

        device_name = device.name


        device.owner = None
        device.is_paired = False

        device.save(
            update_fields=[
                "owner",
                "is_paired",
            ]
        )


        PairingRequest.objects.filter(
            device=device
        ).delete()


        payload = {
            "type":
                "device_unpaired",

            "device_id":
                device.device_key,

            "device_name":
                device_name,
        }


        channel_layer = get_channel_layer()


        # Informe tous les dashboards du compte.
        async_to_sync(
            channel_layer.group_send
        )(
            f"user.{old_owner_id}",
            {
                "type":
                    "signaling.message",

                "payload":
                    payload,
            },
        )


        # Informe spécifiquement l'Emitter afin
        # que son Consumer quitte le groupe utilisateur.
        async_to_sync(
            channel_layer.group_send
        )(
            f"device.{device.device_key}",
            {
                "type":
                    "device.management",

                "action":
                    "unpair",

                "payload":
                    payload,
            },
        )


        return Response({
            "message":
                "Device unpaired successfully."
        })


class DeleteDeviceView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]


    def delete(
        self,
        request,
        device_key,
    ):
        try:
            device = Device.objects.get(
                device_key=device_key,
                owner=request.user,
            )

        except Device.DoesNotExist:
            return Response(
                {
                    "error":
                        "Device not found or you do not own it."
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        old_owner_id = request.user.id

        saved_device_key = (
            device.device_key
        )

        saved_device_name = (
            device.name
        )


        payload = {
            "type":
                "device_deleted",

            "device_id":
                saved_device_key,

            "device_name":
                saved_device_name,
        }


        channel_layer = get_channel_layer()


        # Informe d'abord les connexions actives.
        async_to_sync(
            channel_layer.group_send
        )(
            f"user.{old_owner_id}",
            {
                "type":
                    "signaling.message",

                "payload":
                    payload,
            },
        )


        async_to_sync(
            channel_layer.group_send
        )(
            f"device.{saved_device_key}",
            {
                "type":
                    "device.management",

                "action":
                    "delete",

                "payload":
                    payload,
            },
        )


        # PairingRequest sera supprimé automatiquement
        # grâce au CASCADE.
        device.delete()


        return Response({
            "message":
                "Device deleted successfully."
        })