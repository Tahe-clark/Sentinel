import json
import os
import urllib.error
import urllib.request

from django.http import JsonResponse

from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)

from accounts.authentication import (
    SessionTokenAuthentication,
)


CLOUDFLARE_TURN_ENDPOINT = (
    "https://rtc.live.cloudflare.com"
    "/v1/turn/keys/{key_id}"
    "/credentials/generate-ice-servers"
)


@api_view([
    "GET",
])
@authentication_classes([
    SessionTokenAuthentication,
])
@permission_classes([
    IsAuthenticated,
])
def ice_servers_view(request):
    key_id = os.getenv(
        "CLOUDFLARE_TURN_KEY_ID",
        "",
    ).strip()

    api_token = os.getenv(
        "CLOUDFLARE_TURN_API_TOKEN",
        "",
    ).strip()


    try:
        ttl = int(
            os.getenv(
                "CLOUDFLARE_TURN_TTL",
                "86400",
            )
        )

    except ValueError:
        ttl = 86400


    if (
        not key_id
        or not api_token
    ):
        return JsonResponse(
            {
                "error":
                    "TURN service is not configured."
            },
            status=503,
        )


    url = (
        CLOUDFLARE_TURN_ENDPOINT
        .format(
            key_id=key_id
        )
    )


    payload = json.dumps(
        {
            "ttl":
                ttl,

            "customIdentifier":
                f"sentinel-user-{request.user.id}",
        }
    ).encode(
        "utf-8"
    )


    cloudflare_request = (
        urllib.request.Request(
            url,
            data=payload,
            method="POST",
            headers={
                "Authorization":
                    f"Bearer {api_token}",

                "Content-Type":
                    "application/json",
            },
        )
    )


    try:
        with urllib.request.urlopen(
            cloudflare_request,
            timeout=10,
        ) as response:
            response_body = (
                response
                .read()
                .decode(
                    "utf-8"
                )
            )


        cloudflare_data = (
            json.loads(
                response_body
            )
        )


    except (
        urllib.error.URLError,
        urllib.error.HTTPError,
        TimeoutError,
        json.JSONDecodeError,
    ):
        return JsonResponse(
            {
                "error":
                    "Unable to obtain TURN credentials."
            },
            status=502,
        )


    ice_servers = (
        cloudflare_data
        .get(
            "iceServers"
        )
    )


    if (
        not isinstance(
            ice_servers,
            list,
        )
        or not ice_servers
    ):
        return JsonResponse(
            {
                "error":
                    "TURN provider returned an invalid response."
            },
            status=502,
        )


    cleaned_servers = []


    for server in ice_servers:
        urls = server.get(
            "urls",
            []
        )


        if isinstance(
            urls,
            str,
        ):
            urls = [
                urls
            ]


        filtered_urls = [
            url
            for url in urls
            if ":53" not in url
        ]


        if not filtered_urls:
            continue


        cleaned_server = {
            **server,
            "urls":
                filtered_urls,
        }


        cleaned_servers.append(
            cleaned_server
        )


    return JsonResponse(
        {
            "iceServers":
                cleaned_servers,

            "expiresIn":
                ttl,

            "provider":
                "cloudflare",
        }
    )