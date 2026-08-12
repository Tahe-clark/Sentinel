from rest_framework import generics

from .models import Device
from .serializers import DeviceSerializer


class DeviceListView(
    generics.ListAPIView
):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer