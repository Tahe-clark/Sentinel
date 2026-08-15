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

import {
  getDevices,
} from "../../services/devices";

import type {
  Device,
} from "../../types/device";




function DashboardPage() {
  const [devices, setDevices] =
    useState<Device[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {
    loadDevices();

    const socket =
      createSignalingSocket();


    socket.onmessage = (event) => {
      const data =
        JSON.parse(event.data);


      if (data.type === "device_online") {
  setDevices((currentDevices) => {
    const existingDevice =
      currentDevices.find(
        (device) =>
          device.device_key === data.device_id
      );
        if (data.type === "device_offline") {
        setDevices((currentDevices) =>
            currentDevices.map((device) => {
            if (
                device.device_key ===
                data.device_id
            ) {
                return {
                ...device,
                is_active: false,
                last_seen: data.last_seen,
                };
            }

            return device;
            })
        );
        }
    if (existingDevice) {
      return currentDevices.map(
        (device) => {
          if (
            device.device_key ===
            data.device_id
          ) {
            return {
              ...device,
              name: data.device_name,
              is_active: true,
            };
          }

          return device;
        }
      );
    }

    const newDevice: Device = {
      id: Date.now(),
      name: data.device_name,
      device_key: data.device_id,
      is_active: true,
      created_at:
        new Date().toISOString(),
      last_seen:
        new Date().toISOString(),
    };

    return [
      ...currentDevices,
      newDevice,
    ];
  });
}
    };


    return () => {
      socket.close();
    };
  }, []);


  async function loadDevices() {
    try {
      setLoading(true);

      const result =
        await getDevices();

      setDevices(result);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load devices."
      );
    } finally {
      setLoading(false);
    }
  }


  if (loading) {
    return (
      <main>
        <h1>
          Sentinel Dashboard
        </h1>

        <p>
          Loading devices...
        </p>
      </main>
    );
  }


  if (error) {
    return (
      <main>
        <h1>
          Sentinel Dashboard
        </h1>

        <p>
          {error}
        </p>
      </main>
    );
  }


  return (
    <main>
      <h1>
        Sentinel Dashboard
      </h1>
        <Link to="/pair-device">
  + Add Device
</Link>

      <h2>
        My Devices
      </h2>


      {devices.length === 0 ? (
        <p>
          No devices registered.
        </p>
      ) : (
        <div>
          {devices.map(
            (device) => (
              <div
                key={device.id}
              >
                <h3>
                  {device.is_active
                    ? "🟢"
                    : "⚫"}

                  {" "}

                  {device.name}
                </h3>


                <p>
                  ID:
                  {" "}
                  {device.device_key}
                </p>


                <p>
                  Status:
                  {" "}
                  {device.is_active
                    ? "Online"
                    : "Offline"}
                </p>

                {device.last_seen && (
                <p>
                    Last seen:{" "}
                    {new Date(
                    device.last_seen
                    ).toLocaleString()}
                </p>
                )}


                {device.is_active && (
                  <Link
                    to={
                      `/device/${device.device_key}`
                    }
                  >
                    View Camera
                  </Link>
                )}
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}


export default DashboardPage;