import secrets
from datetime import timedelta

from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView

from .models import Device, PairingRequest
from .serializers import DeviceSerializer


class DeviceListView(ListAPIView):
    serializer_class = DeviceSerializer

    def get_queryset(self):
        return Device.objects.filter(
            is_paired=True
        )


class CreatePairingRequestView(APIView):
    def post(self, request):
        device_key = request.data.get(
            "device_id"
        )

        device_name = request.data.get(
            "device_name"
        )


        if not device_key:
            return Response(
                {
                    "error":
                    "device_id is required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        if not device_name:
            return Response(
                {
                    "error":
                    "device_name is required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        device, _ = Device.objects.get_or_create(
            device_key=device_key,
            defaults={
                "name": device_name,
            },
        )


        device.name = device_name

        device.save(
            update_fields=[
                "name",
            ]
        )


        if device.is_paired:
            return Response(
                {
                    "paired": True,
                    "message":
                    "Device is already paired.",
                }
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
                "code": code,
                "expires_at":
                    expires_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


    def generate_unique_code(self):
        while True:
            code = str(
                secrets.randbelow(900000)
                + 100000
            )

            exists = PairingRequest.objects.filter(
                code=code,
                claimed=False,
            ).exists()

            if not exists:
                return code


class ClaimPairingRequestView(APIView):
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
                .select_related("device")
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

        device.is_paired = True

        device.save(
            update_fields=[
                "is_paired",
            ]
        )


        pairing_request.claimed = True

        pairing_request.save(
            update_fields=[
                "claimed",
            ]
        )


        serializer = DeviceSerializer(
            device
        )


        return Response(
            {
                "message":
                    "Device paired successfully.",

                "device":
                    serializer.data,
            }
        )