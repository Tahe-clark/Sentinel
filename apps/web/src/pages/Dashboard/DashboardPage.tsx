import {
  useEffect,
  useState,
} from "react";

import { createSignalingSocket } from "../../services/signaling";


interface Device {
  name: string;
}


function DashboardPage() {
  const [devices, setDevices] =
    useState<Device[]>([]);

  useEffect(() => {
    const socket =
      createSignalingSocket();

    socket.onmessage = (event) => {
      const data =
        JSON.parse(event.data);

      if (data.type === "device_online") {
        setDevices((currentDevices) => {
          const alreadyExists =
            currentDevices.some(
              (device) =>
                device.name === data.device_name
            );

          if (alreadyExists) {
            return currentDevices;
          }

          return [
            ...currentDevices,
            {
              name: data.device_name,
            },
          ];
        });
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <main>
      <h1>Dashboard</h1>

      <h2>Devices</h2>

      {devices.length === 0 ? (
        <p>No devices connected.</p>
      ) : (
        <ul>
          {devices.map((device) => (
            <li key={device.name}>
              🟢 {device.name}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default DashboardPage;