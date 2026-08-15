import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  useAuth,
} from "../../contexts/AuthContext";

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
  const {
    user,
  } = useAuth();


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


      console.log(
        "Dashboard received:",
        data
      );


      if (
        data.type === "device_online"
      ) {
        setDevices(
          (currentDevices) => {
            const existingDevice =
              currentDevices.find(
                (device) =>
                  device.device_key ===
                  data.device_id
              );


            if (existingDevice) {
              return currentDevices.map(
                (device) => {
                  if (
                    device.device_key ===
                    data.device_id
                  ) {
                    return {
                      ...device,

                      name:
                        data.device_name,

                      is_active:
                        true,

                      last_seen:
                        data.last_seen ??
                        device.last_seen,
                    };
                  }


                  return device;
                }
              );
            }


            /*
             * Normalement l'API contient déjà
             * tous les appareils de l'utilisateur.
             *
             * Mais si un appareil vient d'être pairé
             * pendant que le dashboard est ouvert,
             * on peut l'ajouter immédiatement.
             */
            const newDevice: Device = {
              id:
                data.id ??
                Date.now(),

              name:
                data.device_name,

              device_key:
                data.device_id,

              is_active:
                true,

              created_at:
                new Date().toISOString(),

              last_seen:
                data.last_seen ??
                new Date().toISOString(),

              is_paired:
                true,
            };


            return [
              ...currentDevices,
              newDevice,
            ];
          }
        );
      }


      if (
        data.type === "device_offline"
      ) {
        setDevices(
          (currentDevices) =>
            currentDevices.map(
              (device) => {
                if (
                  device.device_key ===
                  data.device_id
                ) {
                  return {
                    ...device,

                    is_active:
                      false,

                    last_seen:
                      data.last_seen,
                  };
                }


                return device;
              }
            )
        );
      }


      if (
        data.type ===
        "authorization_error"
      ) {
        console.error(
          "Authorization error:",
          data.message
        );
      }
    };


    socket.onerror = (error) => {
      console.error(
        "Dashboard WebSocket error:",
        error
      );
    };


    return () => {
      socket.close();
    };
  }, []);


  async function loadDevices() {
    try {
      setLoading(true);

      setError(null);


      const result =
        await getDevices();


      setDevices(
        result
      );
    } catch (err) {
      console.error(
        err
      );


      setError(
        "Unable to load devices."
      );
    } finally {
      setLoading(
        false
      );
    }
  }


  if (loading) {
    return (
      <main>
        <h1>
          Sentinel Dashboard
        </h1>


        {user && (
          <p>
            Signed in as:
            {" "}
            <strong>
              {user.username}
            </strong>
          </p>
        )}


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


        {user && (
          <p>
            Signed in as:
            {" "}
            <strong>
              {user.username}
            </strong>
          </p>
        )}


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


      {user && (
        <section>
          <p>
            Signed in as:
            {" "}
            <strong>
              {user.username}
            </strong>
          </p>


          {user.email && (
            <p>
              {user.email}
            </p>
          )}
        </section>
      )}


      <p>
        <Link
          to="/pair-device"
        >
          + Add Device
        </Link>
      </p>


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
              <article
                key={
                  device.id
                }
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
                    Last seen:
                    {" "}

                    {new Date(
                      device.last_seen
                    ).toLocaleString()}
                  </p>
                )}


                {device.is_active && (
                  <p>
                    <Link
                      to={
                        `/device/${device.device_key}`
                      }
                    >
                      View Camera
                    </Link>
                  </p>
                )}
              </article>
            )
          )}
        </div>
      )}
    </main>
  );
}


export default DashboardPage;