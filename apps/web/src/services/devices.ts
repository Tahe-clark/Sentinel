import type { Device } from "../types/device";


export async function getDevices(): Promise<Device[]> {
  const host =
    window.location.hostname;

  const response =
    await fetch(
      `http://${host}:8000/api/devices/`, 
      {
        credentials: "include",
      }
    );


  if (!response.ok) {
    throw new Error(
      "Failed to load devices"
    );
  }


  return response.json();
}