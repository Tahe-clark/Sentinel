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


export function setDeviceName(
  name: string
) {
  localStorage.setItem(
    DEVICE_NAME_KEY,
    name
  );
}


export function getDeviceToken():
  string | null {

  return localStorage.getItem(
    DEVICE_TOKEN_KEY
  );
}


export function setDeviceToken(
  token: string
) {
  localStorage.setItem(
    DEVICE_TOKEN_KEY,
    token
  );
}


export function clearDeviceToken() {
  localStorage.removeItem(
    DEVICE_TOKEN_KEY
  );
}