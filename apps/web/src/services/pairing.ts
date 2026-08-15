import {
  getCsrfToken,
} from "./auth";


function getApiBaseUrl() {
  const host =
    window.location.hostname;

  return `http://${host}:8000/api`;
}


export interface PairingRequestResponse {
  paired: boolean;
  code?: string;
  expires_at?: string;
  message?: string;
}


async function readResponse(
  response: Response
) {
  const contentType =
    response.headers.get(
      "content-type"
    );

  if (
    contentType?.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  throw new Error(
    `Server returned ${response.status}: ${text.slice(0, 250)}`
  );
}


export async function requestPairing(
  deviceId: string,
  deviceName: string,
): Promise<PairingRequestResponse> {

  const csrf =
    await getCsrfToken();

  const response =
    await fetch(
      `${getApiBaseUrl()}/devices/pairing/request/`,
      {
        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",

          "X-CSRFToken":
            csrf,
        },

        body: JSON.stringify({
          device_id: deviceId,
          device_name: deviceName,
        }),
      }
    );

  const data =
    await readResponse(
      response
    );

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Unable to request pairing."
    );
  }

  return data;
}


export async function claimPairing(
  code: string,
) {
  const csrf =
    await getCsrfToken();

  const response =
    await fetch(
      `${getApiBaseUrl()}/devices/pairing/claim/`,
      {
        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",

          "X-CSRFToken":
            csrf,
        },

        body: JSON.stringify({
          code,
        }),
      }
    );

  const data =
    await readResponse(
      response
    );

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Unable to pair device."
    );
  }

  return data;
}