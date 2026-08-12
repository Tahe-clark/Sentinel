import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  createSignalingSocket,
} from "../../services/signaling";


interface Device {
  id: string;
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


      if (
        data.type ===
        "device_online"
      ) {
        setDevices(
          (currentDevices) => {
            const exists =
              currentDevices.some(
                (device) =>
                  device.id ===
                  data.device_id
              );


            if (exists) {
              return currentDevices;
            }


            return [
              ...currentDevices,
              {
                id:
                  data.device_id,

                name:
                  data.device_name,
              },
            ];
          }
        );
      }
    };


    return () => {
      socket.close();
    };
  }, []);


  return (
    <main>
      <h1>
        Sentinel Dashboard
      </h1>


      <h2>
        Connected Devices
      </h2>


      {devices.length === 0 ? (
        <p>
          No devices connected.
        </p>
      ) : (
        <div>
          {devices.map(
            (device) => (
              <div
                key={device.id}
              >
                <h3>
                  🟢 {device.name}
                </h3>

                <p>
                  ID: {device.id}
                </p>


                <Link
                  to={
                    `/device/${device.id}`
                  }
                >
                  View Camera
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}


export default DashboardPage;