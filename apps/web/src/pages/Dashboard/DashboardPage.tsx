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
  deleteDevice,
  getDevices,
  unpairDevice,
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
    useState<string | null>(
      null
    );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    actionDevice,
    setActionDevice,
  ] = useState<string | null>(
    null
  );


  useEffect(() => {
    loadDevices();


    const socket =
      createSignalingSocket();


    socket.onmessage = (
      event
    ) => {
      const data =
        JSON.parse(
          event.data
        );


      if (
        data.type ===
        "device_online"
      ) {
        setDevices(
          (
            currentDevices
          ) => {
            const existing =
              currentDevices.find(
                (device) =>
                  device.device_key ===
                  data.device_id
              );


            if (existing) {
              return (
                currentDevices.map(
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
                )
              );
            }


            const newDevice:
              Device = {
                id:
                  data.id ??
                  Date.now(),

                name:
                  data.device_name,

                device_key:
                  data.device_id,

                created_at:
                  new Date()
                    .toISOString(),

                last_seen:
                  data.last_seen ??
                  new Date()
                    .toISOString(),

                is_active:
                  true,

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
        data.type ===
        "device_offline"
      ) {
        setDevices(
          (
            currentDevices
          ) =>
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
          "device_unpaired" ||
        data.type ===
          "device_deleted"
      ) {
        setDevices(
          (
            currentDevices
          ) =>
            currentDevices.filter(
              (device) =>
                device.device_key !==
                data.device_id
            )
        );
      }
    };


    return () => {
      socket.close();
    };
  }, []);


  async function loadDevices() {
    try {
      setLoading(
        true
      );

      setError(
        null
      );


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


  async function handleUnpair(
    device: Device
  ) {
    const confirmed =
      window.confirm(
        `Unpair "${device.name}"?\n\nThe device will be removed from this account and can then be paired with another Sentinel account.`
      );


    if (!confirmed) {
      return;
    }


    try {
      setActionDevice(
        device.device_key
      );

      setMessage(
        ""
      );


      const result =
        await unpairDevice(
          device.device_key
        );


      setDevices(
        (
          currentDevices
        ) =>
          currentDevices.filter(
            (item) =>
              item.device_key !==
              device.device_key
          )
      );


      setMessage(
        result.message ??
        "Device unpaired."
      );

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to unpair device."
      );

    } finally {
      setActionDevice(
        null
      );
    }
  }


  async function handleDelete(
    device: Device
  ) {
    const confirmed =
      window.confirm(
        `Delete "${device.name}" from Sentinel?\n\nThis removes the device record completely. The computer can still be paired again later as a new Sentinel device.`
      );


    if (!confirmed) {
      return;
    }


    try {
      setActionDevice(
        device.device_key
      );

      setMessage(
        ""
      );


      const result =
        await deleteDevice(
          device.device_key
        );


      setDevices(
        (
          currentDevices
        ) =>
          currentDevices.filter(
            (item) =>
              item.device_key !==
              device.device_key
          )
      );


      setMessage(
        result.message ??
        "Device deleted."
      );

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete device."
      );

    } finally {
      setActionDevice(
        null
      );
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


      {message && (
        <p>
          {message}
        </p>
      )}


      <h2>
        My Devices
      </h2>


      {devices.length === 0 ? (
        <p>
          No devices paired.
        </p>
      ) : (
        <div>
          {devices.map(
            (device) => {
              const busy =
                actionDevice ===
                device.device_key;


              return (
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
                    <>
                      <Link
                        to={
                          `/device/${device.device_key}`
                        }
                      >
                        View Camera
                      </Link>

                      {" "}
                    </>
                  )}


                  <button
                    type="button"

                    disabled={
                      busy
                    }

                    onClick={() =>
                      handleUnpair(
                        device
                      )
                    }
                  >
                    {busy
                      ? "Working..."
                      : "Unpair"}
                  </button>


                  {" "}


                  <button
                    type="button"

                    disabled={
                      busy
                    }

                    onClick={() =>
                      handleDelete(
                        device
                      )
                    }
                  >
                    {busy
                      ? "Working..."
                      : "Delete"}
                  </button>
                </article>
              );
            }
          )}
        </div>
      )}
    </main>
  );
}


export default DashboardPage;