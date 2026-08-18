import {
  API_BASE_URL,
} from "../config/environment";

import {
  getAuthHeaders,
} from "./auth";

import type {
  Device,
} from "../types/device";


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


export async function getDevices():
  Promise<Device[]> {

  const response =
    await fetch(
      `${API_BASE_URL}/devices/`,
      {
        headers: {
          ...getAuthHeaders(),
        },
      }
    );


  const data =
    await readResponse(
      response
    );


  if (!response.ok) {
    throw new Error(
      data.error ||
      "Failed to load devices."
    );
  }


  return data;
}


export async function unpairDevice(
  deviceKey: string,
) {
  const response =
    await fetch(
      `${API_BASE_URL}/devices/${encodeURIComponent(deviceKey)}/unpair/`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          ...getAuthHeaders(),
        },

        body:
          JSON.stringify({}),
      }
    );


  const data =
    await readResponse(
      response
    );


  if (!response.ok) {
    throw new Error(
      data.error ||
      "Unable to unpair device."
    );
  }


  return data;
}


export async function deleteDevice(
  deviceKey: string,
) {
  const response =
    await fetch(
      `${API_BASE_URL}/devices/${encodeURIComponent(deviceKey)}/`,
      {
        method:
          "DELETE",

        headers: {
          ...getAuthHeaders(),
        },
      }
    );


  const data =
    await readResponse(
      response
    );


  if (!response.ok) {
    throw new Error(
      data.error ||
      "Unable to delete device."
    );
  }


  return data;
}