import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  useAuth,
} from "../../contexts/AuthContext";

import {
  useTheme,
} from "../../contexts/ThemeContext";

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

  const {
    theme,
  } = useTheme();


  const [devices, setDevices] =
    useState<Device[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null
    );

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
            current
          ) => {
            const found =
              current.find(
                (device) =>
                  device.device_key ===
                  data.device_id
              );


            if (found) {
              return current.map(
                (device) =>
                  device.device_key ===
                  data.device_id
                    ? {
                        ...device,

                        name:
                          data.device_name,

                        is_active:
                          true,

                        last_seen:
                          data.last_seen ??
                          device.last_seen,
                      }
                    : device
              );
            }


            return [
              ...current,

              {
                id:
                  data.id ??
                  Date.now(),

                name:
                  data.device_name,

                device_key:
                  data.device_id,

                is_active:
                  true,

                is_paired:
                  true,

                created_at:
                  new Date()
                    .toISOString(),

                last_seen:
                  data.last_seen ??
                  new Date()
                    .toISOString(),
              },
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
            current
          ) =>
            current.map(
              (device) =>
                device.device_key ===
                data.device_id
                  ? {
                      ...device,

                      is_active:
                        false,

                      last_seen:
                        data.last_seen,
                    }
                  : device
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
            current
          ) =>
            current.filter(
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
    if (
      !window.confirm(
        `Unpair "${device.name}" ?`
      )
    ) {
      return;
    }


    try {
      setActionDevice(
        device.device_key
      );


      await unpairDevice(
        device.device_key
      );


      setDevices(
        (
          current
        ) =>
          current.filter(
            (item) =>
              item.device_key !==
              device.device_key
          )
      );

    } catch (error) {
      console.error(
        error
      );

      window.alert(
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
    if (
      !window.confirm(
        `Delete "${device.name}" from Sentinel ?`
      )
    ) {
      return;
    }


    try {
      setActionDevice(
        device.device_key
      );


      await deleteDevice(
        device.device_key
      );


      setDevices(
        (
          current
        ) =>
          current.filter(
            (item) =>
              item.device_key !==
              device.device_key
          )
      );

    } catch (error) {
      console.error(
        error
      );

      window.alert(
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


  const activeCount =
    devices.filter(
      (device) =>
        device.is_active
    ).length;


  if (loading) {
    return (
      <p>
        Initialisation du centre
        de commande...
      </p>
    );
  }


  if (error) {
    return (
      <p>
        {error}
      </p>
    );
  }


  if (
    theme === "glass"
  ) {
    return (
      <div
        className="
          space-y-8
        "
      >
        <div
          className="
            flex
            items-end
            justify-between
          "
        >
          <div>
            <h1
              className="
                text-3xl
                font-semibold
                tracking-tight
              "
            >
              Caméras
            </h1>

            <p
              className="
                text-sm
                text-muted
                mt-1
              "
            >
              {activeCount}
              {" "}
              appareil
              {activeCount !== 1
                ? "s"
                : ""}
              {" "}
              connecté
              {activeCount !== 1
                ? "s"
                : ""}
              {" "}
              sur le réseau
            </p>

            {user && (
              <p
                className="
                  text-xs
                  text-muted
                  mt-1
                "
              >
                Connecté en tant que
                {" "}
                {user.username}
              </p>
            )}
          </div>


          <Link
            to="/pair-device"

            className="
              px-4
              py-2
              rounded-full
              btn-primary
              text-xs
              font-medium
              transition-all
              shadow-sm
            "
          >
            + Ajouter
          </Link>
        </div>


        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-6
          "
        >
          {devices.map(
            (
              device,
              index
            ) => (
              <GlassDeviceCard
                key={
                  device.device_key
                }

                device={
                  device
                }

                busy={
                  actionDevice ===
                  device.device_key
                }

                onUnpair={
                  handleUnpair
                }

                onDelete={
                  handleDelete
                }

                index={
                  index
                }
              />
            )
          )}
        </div>


        {devices.length === 0 && (
          <div
            className="
              glass-card
              rounded-3xl
              p-8
              text-center
              text-sm
              text-muted
            "
          >
            Aucun appareil pairé.
          </div>
        )}
      </div>
    );
  }


  return (
    <div
      className="
        space-y-6
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-tactical-border
          pb-4
        "
      >
        <div>
          <h1
            className="
              text-xl
              font-bold
              font-mono
              text-white
              tracking-wide
              uppercase
            "
          >
            Centre de Commande /
            Caméras
          </h1>

          <p
            className="
              text-xs
              font-mono
              text-slate-400
            "
          >
            {activeCount}
            {" "}
            Appareils actifs sur
            le réseau local
          </p>

          {user && (
            <p
              className="
                text-[10px]
                font-mono
                text-emerald-500/70
                mt-1
              "
            >
              OPÉRATEUR:
              {" "}
              {user.username}
            </p>
          )}
        </div>


        <Link
          to="/pair-device"

          className="
            px-3
            py-1.5
            rounded
            bg-emerald-600
            hover:bg-emerald-500
            text-black
            font-mono
            text-xs
            font-bold
            uppercase
            transition-colors
          "
        >
          + Ajouter un flux
        </Link>
      </div>


      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-3
          gap-5
        "
      >
        {devices.map(
          (
            device,
            index
          ) => (
            <TacticalDeviceCard
              key={
                device.device_key
              }

              device={
                device
              }

              index={
                index
              }

              busy={
                actionDevice ===
                device.device_key
              }

              onUnpair={
                handleUnpair
              }

              onDelete={
                handleDelete
              }
            />
          )
        )}
      </div>


      {devices.length === 0 && (
        <div
          className="
            panel-tactical
            rounded
            p-6
            font-mono
            text-xs
            text-slate-400
          "
        >
          AUCUN FLUX ENREGISTRÉ.
        </div>
      )}
    </div>
  );
}


/* ========================================================= */
/* BLURRED LIVE PREVIEW                                       */
/* ========================================================= */

function BlurredCameraPreview({
  device,
}: {
  device: Device;
}) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const socketRef =
    useRef<WebSocket | null>(
      null
    );

  const peerConnectionRef =
    useRef<RTCPeerConnection | null>(
      null
    );

  const viewerIdRef =
    useRef(
      crypto.randomUUID()
    );

  const pendingIceCandidatesRef =
    useRef<
      RTCIceCandidateInit[]
    >([]);

  const [
    previewStatus,
    setPreviewStatus,
  ] = useState(
    "Connecting"
  );


  useEffect(() => {
    if (
      !device.is_active
    ) {
      return;
    }


    const socket =
      createSignalingSocket();


    socketRef.current =
      socket;


    socket.onopen = () => {
      requestPreview();
    };


    socket.onmessage =
      async (event) => {
        const data =
          JSON.parse(
            event.data
          );


        if (
          data.type ===
            "webrtc_offer" &&
          data.target_viewer_id ===
            viewerIdRef.current &&
          data.device_id ===
            device.device_key
        ) {
          await handleOffer(
            data.offer
          );

          return;
        }


        if (
          data.type ===
            "ice_candidate" &&
          data.target_viewer_id ===
            viewerIdRef.current
        ) {
          await handleRemoteIceCandidate(
            data.candidate
          );

          return;
        }


        if (
          data.type ===
            "camera_unavailable" &&
          data.target_viewer_id ===
            viewerIdRef.current
        ) {
          setPreviewStatus(
            "Waiting"
          );

          return;
        }


        if (
          data.type ===
            "camera_stopped" &&
          data.device_id ===
            device.device_key
        ) {
          peerConnectionRef.current
            ?.close();


          peerConnectionRef.current =
            null;


          if (
            videoRef.current
          ) {
            videoRef.current.srcObject =
              null;
          }


          setPreviewStatus(
            "Stopped"
          );
        }
      };


    socket.onerror = () => {
      setPreviewStatus(
        "Unavailable"
      );
    };


    return () => {
      socket.close();


      peerConnectionRef.current
        ?.close();
    };
  }, [
    device.device_key,
    device.is_active,
  ]);


  function requestPreview() {
    const socket =
      socketRef.current;


    if (
      !socket ||
      socket.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }


    socket.send(
      JSON.stringify({
        type:
          "watch_device",

        viewer_id:
          viewerIdRef.current,

        target_device_id:
          device.device_key,
      })
    );


    setPreviewStatus(
      "Requesting"
    );
  }


  function createPeerConnection() {
    const peerConnection =
      new RTCPeerConnection({
        iceServers: [
          {
            urls:
              "stun:stun.l.google.com:19302",
          },
        ],
      });


    peerConnection.ontrack =
      (event) => {
        const stream =
          event.streams[0];


        if (
          !stream ||
          !videoRef.current
        ) {
          return;
        }


        videoRef.current.srcObject =
          stream;


        videoRef.current
          .play()
          .catch(
            console.warn
          );


        setPreviewStatus(
          "Live"
        );
      };


    peerConnection.onicecandidate =
      (event) => {
        if (
          !event.candidate
        ) {
          return;
        }


        socketRef.current?.send(
          JSON.stringify({
            type:
              "ice_candidate",

            viewer_id:
              viewerIdRef.current,

            target_device_id:
              device.device_key,

            candidate:
              event.candidate
                .toJSON(),
          })
        );
      };


    return peerConnection;
  }


  async function handleOffer(
    offer:
      RTCSessionDescriptionInit
  ) {
    peerConnectionRef.current
      ?.close();


    pendingIceCandidatesRef.current =
      [];


    const peerConnection =
      createPeerConnection();


    peerConnectionRef.current =
      peerConnection;


    await peerConnection
      .setRemoteDescription(
        offer
      );


    for (
      const candidate
      of pendingIceCandidatesRef.current
    ) {
      await peerConnection
        .addIceCandidate(
          candidate
        );
    }


    pendingIceCandidatesRef.current =
      [];


    const answer =
      await peerConnection
        .createAnswer();


    await peerConnection
      .setLocalDescription(
        answer
      );


    socketRef.current?.send(
      JSON.stringify({
        type:
          "webrtc_answer",

        viewer_id:
          viewerIdRef.current,

        target_device_id:
          device.device_key,

        answer:
          peerConnection
            .localDescription,
      })
    );
  }


  async function handleRemoteIceCandidate(
    candidate:
      RTCIceCandidateInit
  ) {
    const peerConnection =
      peerConnectionRef.current;


    if (
      !peerConnection ||
      !peerConnection
        .remoteDescription
    ) {
      pendingIceCandidatesRef.current
        .push(
          candidate
        );

      return;
    }


    await peerConnection
      .addIceCandidate(
        candidate
      );
  }


  return (
    <>
      <video
        ref={
          videoRef
        }

        autoPlay

        muted

        playsInline

        className="
          absolute
          inset-0
          w-full
          h-full
          object-cover
          scale-[1.08]
          blur-[10px]
          opacity-75
          transition-all
          duration-500
        "
      />


      <div
        className="
          absolute
          inset-0
          bg-black/20
          pointer-events-none
        "
      />


      {previewStatus !==
        "Live" && (
        <span
          className="
            absolute
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2
            z-20
            text-[10px]
            text-white/40
            font-mono
            tracking-wider
          "
        >
          PREVIEW //
          {" "}
          {previewStatus.toUpperCase()}
        </span>
      )}
    </>
  );
}


/* ========================================================= */
/* TACTICAL CARD                                              */
/* ========================================================= */

function TacticalDeviceCard({
  device,
  index,
  busy,
  onUnpair,
  onDelete,
}: {
  device: Device;
  index: number;
  busy: boolean;

  onUnpair:
    (device: Device) =>
      void;

  onDelete:
    (device: Device) =>
      void;
}) {
  const number =
    String(
      index + 1
    ).padStart(
      2,
      "0"
    );


  return (
    <div
      className="
        panel-tactical
        rounded
        border
        border-tactical-border
        overflow-hidden
        group
      "
    >
      <div
        className="
          relative
          aspect-video
          bg-black
          flex
          items-center
          justify-center
          border-b
          border-tactical-border
          overflow-hidden
        "
      >
        {device.is_active && (
          <BlurredCameraPreview
            device={
              device
            }
          />
        )}


        <div
          className={`
            absolute
            inset-2
            border
            pointer-events-none
            flex
            flex-col
            justify-between
            p-2
            z-10

            ${
              device.is_active
                ? "border-emerald-500/20"
                : "border-slate-800"
            }
          `}
        >
          <div
            className={`
              flex
              justify-between
              font-mono
              text-[10px]

              ${
                device.is_active
                  ? "text-emerald-500/80"
                  : "text-amber-500/70"
              }
            `}
          >
            <span>
              CAM_{number}
              {" "}
              // NODE
            </span>

            <span>
              {device.is_active
                ? "LIVE ●"
                : "STANDBY"}
            </span>
          </div>


          {device.is_active && (
            <div
              className="
                flex
                justify-between
                font-mono
                text-[10px]
                text-emerald-500/80
              "
            >
              <span>
                PREVIEW: SECURED
              </span>

              <span>
                WEBRTC
              </span>
            </div>
          )}
        </div>


        {!device.is_active && (
          <span
            className="
              font-mono
              text-xs
              text-slate-600
              z-20
            "
          >
            FLUX EN ATTENTE
          </span>
        )}
      </div>


      <div
        className="
          p-3.5
          space-y-3
          font-mono
          text-xs
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <span
            className="
              text-white
              font-bold
            "
          >
            {device.name}
          </span>


          <span
            className={
              device.is_active
                ? "text-emerald-400 text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/30"
                : "text-amber-400 text-[10px] px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-500/30"
            }
          >
            {device.is_active
              ? "EN LIGNE"
              : "PAUSE"}
          </span>
        </div>


        <div
          className="
            flex
            justify-between
            text-slate-400
            text-[11px]
          "
        >
          <span>
            ID:
            {" "}
            {device.device_key
              .slice(
                0,
                8
              )}
            ...
          </span>


          {device.is_active ? (
            <Link
              to={
                `/device/${device.device_key}`
              }

              className="
                text-emerald-400
                hover:underline
              "
            >
              Visionner →
            </Link>
          ) : (
            <span
              className="
                text-slate-500
              "
            >
              Visionner →
            </span>
          )}
        </div>


        <div
          className="
            flex
            gap-2
            pt-1
          "
        >
          <button
            type="button"

            disabled={
              busy
            }

            onClick={() =>
              onUnpair(
                device
              )
            }

            className="
              text-[10px]
              text-amber-400
              border
              border-amber-500/20
              px-2
              py-1
              rounded
              hover:bg-amber-950/30
              disabled:opacity-40
            "
          >
            UNPAIR
          </button>


          <button
            type="button"

            disabled={
              busy
            }

            onClick={() =>
              onDelete(
                device
              )
            }

            className="
              text-[10px]
              text-red-400
              border
              border-red-500/20
              px-2
              py-1
              rounded
              hover:bg-red-950/30
              disabled:opacity-40
            "
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}


/* ========================================================= */
/* GLASS CARD                                                 */
/* ========================================================= */

function GlassDeviceCard({
  device,
  busy,
  onUnpair,
  onDelete,
}: {
  device: Device;
  busy: boolean;
  index: number;

  onUnpair:
    (device: Device) =>
      void;

  onDelete:
    (device: Device) =>
      void;
}) {
  return (
    <div
      className="
        glass-card
        rounded-3xl
        p-4
        transition-all
        hover:scale-[1.01]
      "
    >
      <div
        className={
          device.is_active
            ? "aspect-video bg-black/90 rounded-2xl relative overflow-hidden flex items-center justify-center"
            : "aspect-video bg-white/5 rounded-2xl relative overflow-hidden flex items-center justify-center"
        }
      >
        {device.is_active && (
          <BlurredCameraPreview
            device={
              device
            }
          />
        )}


        <span
          className={
            device.is_active
              ? "inline-flex items-center gap-1.5 absolute top-3 left-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-medium z-20"
              : "inline-flex items-center gap-1.5 absolute top-3 left-3 px-3 py-1 rounded-full bg-white/10 text-muted text-[11px] font-medium z-20"
          }
        >
          {device.is_active && (
            <span
              className="
                w-1.5
                h-1.5
                rounded-full
                bg-emerald-400
              "
            />
          )}


          {device.is_active
            ? "En direct"
            : "Inactif"}
        </span>


        {!device.is_active && (
          <span
            className="
              text-xs
              text-muted
            "
          >
            Hors ligne
          </span>
        )}


        {device.is_active && (
          <div
            className="
              absolute
              inset-x-0
              bottom-0
              h-16
              bg-gradient-to-t
              from-black/60
              to-transparent
              pointer-events-none
              z-10
            "
          />
        )}
      </div>


      <div
        className="
          mt-4
          flex
          items-center
          justify-between
          px-1
        "
      >
        <div>
          <h3
            className="
              text-sm
              font-semibold
            "
          >
            {device.name}
          </h3>


          <p
            className="
              text-xs
              text-muted
            "
          >
            {device.device_key
              .slice(
                0,
                12
              )}
            ...
          </p>
        </div>


        {device.is_active ? (
          <Link
            to={
              `/device/${device.device_key}`
            }

            title="Visionner"

            className="
              w-8
              h-8
              rounded-full
              bg-white/10
              flex
              items-center
              justify-center
              text-xs
              hover:bg-white
              hover:text-black
              transition-colors
            "
          >
            →
          </Link>
        ) : (
          <button
            type="button"

            disabled

            className="
              w-8
              h-8
              rounded-full
              bg-white/5
              flex
              items-center
              justify-center
              text-muted
              text-xs
              cursor-not-allowed
            "
          >
            →
          </button>
        )}
      </div>


      <div
        className="
          flex
          gap-3
          px-1
          mt-3
        "
      >
        <button
          type="button"

          disabled={
            busy
          }

          onClick={() =>
            onUnpair(
              device
            )
          }

          className="
            text-[11px]
            text-muted
            hover:text-white
            disabled:opacity-40
          "
        >
          Unpair
        </button>


        <button
          type="button"

          disabled={
            busy
          }

          onClick={() =>
            onDelete(
              device
            )
          }

          className="
            text-[11px]
            text-rose-400
            disabled:opacity-40
          "
        >
          Delete
        </button>
      </div>
    </div>
  );
}


export default DashboardPage;