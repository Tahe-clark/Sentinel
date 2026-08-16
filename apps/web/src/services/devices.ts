import {
  getCsrfToken,
} from "./auth";

import type {
  Device,
} from "../types/device";


function getApiBaseUrl() {
  const host =
    window.location.hostname;


  return `http://${host}:8000/api`;
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


export async function getDevices():
  Promise<Device[]> {

  const response =
    await fetch(
      `${getApiBaseUrl()}/devices/`,
      {
        credentials:
          "include",
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
  const csrf =
    await getCsrfToken();


  const response =
    await fetch(
      `${getApiBaseUrl()}/devices/${encodeURIComponent(deviceKey)}/unpair/`,
      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          "Content-Type":
            "application/json",

          "X-CSRFToken":
            csrf,
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
  const csrf =
    await getCsrfToken();


  const response =
    await fetch(
      `${getApiBaseUrl()}/devices/${encodeURIComponent(deviceKey)}/`,
      {
        method:
          "DELETE",

        credentials:
          "include",

        headers: {
          "X-CSRFToken":
            csrf,
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