const DEVICE_ID_KEY =
  "sentinel_device_id";

const DEVICE_NAME_KEY =
  "sentinel_device_name";

const DEVICE_TOKEN_KEY =
  "sentinel_device_token";


export interface DeviceIdentity {
  id: string;
  name: string;
}


export function getDeviceIdentity():
  DeviceIdentity {

  let id =
    localStorage.getItem(
      DEVICE_ID_KEY
    );

  let name =
    localStorage.getItem(
      DEVICE_NAME_KEY
    );


  if (!id) {
    id =
      crypto.randomUUID();

    localStorage.setItem(
      DEVICE_ID_KEY,
      id
    );
  }


  if (!name) {
    name =
      generateDefaultDeviceName();

    localStorage.setItem(
      DEVICE_NAME_KEY,
      name
    );
  }


  return {
    id,
    name,
  };
}


function generateDefaultDeviceName():
  string {

  const platform =
    navigator.platform ||
    "Device";


  return `Sentinel ${platform}`;
}


function generateDeviceToken():
  string {

  const bytes =
    new Uint8Array(32);


  crypto.getRandomValues(
    bytes
  );


  return Array.from(
    bytes,
    (byte) =>
      byte
        .toString(16)
        .padStart(2, "0")
  ).join("");
}


export function getDeviceToken():
  string {

  let token =
    localStorage.getItem(
      DEVICE_TOKEN_KEY
    );


  if (!token) {
    token =
      generateDeviceToken();

    localStorage.setItem(
      DEVICE_TOKEN_KEY,
      token
    );
  }


  return token;
}


export function setDeviceName(
  name: string
) {
  localStorage.setItem(
    DEVICE_NAME_KEY,
    name
  );
}