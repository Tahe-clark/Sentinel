const DEVICE_ID_KEY =
  "sentinel_device_id";

const DEVICE_NAME_KEY =
  "sentinel_device_name";


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
    id = crypto.randomUUID();

    localStorage.setItem(
      DEVICE_ID_KEY,
      id
    );
  }


  if (!name) {
    name = generateDefaultDeviceName();

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