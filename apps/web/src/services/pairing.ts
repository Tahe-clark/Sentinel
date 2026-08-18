import {
  API_BASE_URL,
} from "../config/environment";

import {
  getAuthHeaders,
} from "./auth";


export interface PairingOwner {
  id: number;
  username: string;
  email: string;
}


export interface PairingRequestResponse {
  paired: boolean;

  code?: string;

  expires_at?: string;

  message?: string;

  owner?: PairingOwner | null;
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
  deviceToken: string,
): Promise<PairingRequestResponse> {

  const response =
    await fetch(
      `${API_BASE_URL}/devices/pairing/request/`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            device_id:
              deviceId,

            device_name:
              deviceName,

            device_token:
              deviceToken,
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
  const response =
    await fetch(
      `${API_BASE_URL}/devices/pairing/claim/`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          ...getAuthHeaders(),
        },

        body:
          JSON.stringify({
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