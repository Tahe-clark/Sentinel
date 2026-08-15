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


export async function requestPairing(
  deviceId: string,
  deviceName: string,
): Promise<PairingRequestResponse> {

  const response =
    await fetch(
      `${getApiBaseUrl()}/devices/pairing/request/`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          device_id: deviceId,
          device_name: deviceName,
        }),
      }
    );


  const data =
    await response.json();


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
      `${getApiBaseUrl()}/devices/pairing/claim/`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          code,
        }),
      }
    );


  const data =
    await response.json();


  if (!response.ok) {
    throw new Error(
      data.error ||
      "Unable to pair device."
    );
  }


  return data;
}