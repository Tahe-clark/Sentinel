import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createSignalingSocket,
} from "../../services/signaling";

import {
  createConfiguredPeerConnection,
} from "../../services/webrtc";

import {
  getDeviceIdentity,
  getDeviceToken,
  setDeviceName,
} from "../../services/deviceIdentity";

import {
  requestPairing,
} from "../../services/pairing";

import type {
  PairingOwner,
} from "../../services/pairing";

import {
  useTheme,
} from "../../contexts/ThemeContext";


const DEVICE =
  getDeviceIdentity();


function EmitterPage() {
  const {
    theme,
  } = useTheme();


  const videoRef =
    useRef<HTMLVideoElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const socketRef =
    useRef<WebSocket | null>(null);

  const peerConnectionRef =
    useRef<RTCPeerConnection | null>(
      null
    );

  const pendingIceCandidatesRef =
    useRef<RTCIceCandidateInit[]>([]);


  const [
    cameraActive,
    setCameraActive,
  ] = useState(false);

  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState("Waiting");

  const [
    deviceName,
    setDeviceNameState,
  ] = useState(
    DEVICE.name
  );

  const [
    pairingCode,
    setPairingCode,
  ] = useState<string | null>(
    null
  );

  const [
    pairingExpiresAt,
    setPairingExpiresAt,
  ] = useState<string | null>(
    null
  );

  const [
    pairingMessage,
    setPairingMessage,
  ] = useState("");

  const [
    paired,
    setPaired,
  ] = useState(false);

  const [
    owner,
    setOwner,
  ] = useState<PairingOwner | null>(
    null
  );


  useEffect(() => {
    let disposed = false;
    let reconnectTimer:
      number | undefined;
    let reconnectAttempt = 0;


    function scheduleReconnect() {
      if (disposed) {
        return;
      }


      const delay = Math.min(
        1000 *
        2 ** reconnectAttempt,
        10000
      );


      reconnectAttempt += 1;


      setConnectionStatus(
        "Reconnecting signaling..."
      );


      reconnectTimer =
        window.setTimeout(
          connectSocket,
          delay
        );
    }


    function connectSocket() {
      if (disposed) {
        return;
      }


      const existing =
        socketRef.current;


      if (
        existing &&
        (
          existing.readyState ===
            WebSocket.OPEN ||
          existing.readyState ===
            WebSocket.CONNECTING
        )
      ) {
        return;
      }


      const socket =
        createSignalingSocket(
          "emitter"
        );


      socketRef.current =
        socket;


      socket.onopen = () => {
        console.log(
          "Emitter connected"
        );


        reconnectAttempt = 0;


        const currentIdentity =
          getDeviceIdentity();


        sendDeviceOnline(
          socket,
          getDeviceToken(),
          currentIdentity.name
        );


        if (
          streamRef.current
        ) {
          socket.send(
            JSON.stringify({
              type:
                "camera_ready",

              device_id:
                DEVICE.id,
            })
          );
        }
      };


      socket.onmessage =
        async (event) => {
          const data =
            JSON.parse(
              event.data
            );


          console.log(
            "Emitter received:",
            data
          );


          if (
            data.type ===
            "device_authenticated"
          ) {
            setPaired(
              Boolean(
                data.paired
              )
            );


            setOwner(
              data.owner ??
              null
            );


            setConnectionStatus(
              streamRef.current
                ? "Camera active"
                : "Ready"
            );


            return;
          }


          if (
            data.type ===
            "device_authentication_error"
          ) {
            console.error(
              data.message
            );


            setConnectionStatus(
              "Authentication failed"
            );


            return;
          }


          if (
            data.type ===
            "pairing_completed"
          ) {
            setPaired(
              true
            );


            setOwner(
              data.owner ??
              null
            );


            setPairingCode(
              null
            );


            setPairingExpiresAt(
              null
            );


            setPairingMessage(
              "Device paired successfully."
            );


            return;
          }


          if (
            data.type ===
            "device_unpaired"
          ) {
            setPaired(
              false
            );


            setOwner(
              null
            );


            setPairingCode(
              null
            );


            setPairingExpiresAt(
              null
            );


            setPairingMessage(
              "This device has been unpaired. You can pair it with another Sentinel account."
            );


            peerConnectionRef.current
              ?.close();


            peerConnectionRef.current =
              null;


            setConnectionStatus(
              "Unpaired"
            );


            return;
          }


          if (
            data.type ===
            "device_deleted"
          ) {
            setPaired(
              false
            );


            setOwner(
              null
            );


            setPairingCode(
              null
            );


            setPairingExpiresAt(
              null
            );


            setPairingMessage(
              "Device deleted. You can pair it again."
            );


            peerConnectionRef.current
              ?.close();


            peerConnectionRef.current =
              null;


            setConnectionStatus(
              "Device deleted"
            );


            return;
          }


          if (
            data.type ===
              "watch_device" &&
            data.target_device_id ===
              DEVICE.id
          ) {
            await handleWatchRequest(
              data.viewer_id
            );


            return;
          }


          if (
            data.type ===
              "webrtc_answer" &&
            data.target_device_id ===
              DEVICE.id
          ) {
            await handleAnswer(
              data.answer
            );


            return;
          }


          if (
            data.type ===
              "ice_candidate" &&
            data.target_device_id ===
              DEVICE.id
          ) {
            await handleRemoteIceCandidate(
              data.candidate
            );
          }
        };


      socket.onerror = (
        error
      ) => {
        console.error(
          "Emitter WebSocket error:",
          error
        );
      };


      socket.onclose = () => {
        if (
          socketRef.current ===
          socket
        ) {
          socketRef.current =
            null;
        }


        if (!disposed) {
          setConnectionStatus(
            "Signaling disconnected"
          );


          scheduleReconnect();
        }
      };
    }


    function handleOnline() {
      connectSocket();
    }


    connectSocket();


    window.addEventListener(
      "online",
      handleOnline
    );


    return () => {
      disposed = true;


      if (
        reconnectTimer !==
        undefined
      ) {
        window.clearTimeout(
          reconnectTimer
        );
      }


      window.removeEventListener(
        "online",
        handleOnline
      );


      socketRef.current
        ?.close();


      socketRef.current =
        null;


      peerConnectionRef.current
        ?.close();


      streamRef.current
        ?.getTracks()
        .forEach(
          (track) => {
            track.stop();
          }
        );
    };
  }, []);

  function sendDeviceOnline(
    socket: WebSocket,
    token: string,
    name: string,
  ) {
    if (
      socket.readyState !==
      WebSocket.OPEN
    ) {
      return;
    }


    socket.send(
      JSON.stringify({
        type:
          "device_online",

        device_id:
          DEVICE.id,

        device_name:
          name,

        device_token:
          token,
      })
    );
  }


  function saveDeviceName() {
    const cleanName =
      deviceName.trim();


    if (!cleanName) {
      return;
    }


    setDeviceName(
      cleanName
    );


    setDeviceNameState(
      cleanName
    );


    const socket =
      socketRef.current;


    if (
      socket &&
      socket.readyState ===
        WebSocket.OPEN
    ) {
      sendDeviceOnline(
        socket,
        getDeviceToken(),
        cleanName,
      );
    }
  }


  async function createPairingCode() {
    try {
      setPairingMessage(
        "Generating pairing code..."
      );


      const result =
        await requestPairing(
          DEVICE.id,
          deviceName,
          getDeviceToken(),
        );


      if (
        result.paired
      ) {
        setPaired(
          true
        );


        setOwner(
          result.owner ??
          null
        );


        setPairingCode(
          null
        );


        setPairingExpiresAt(
          null
        );


        setPairingMessage(
          "This device is already paired."
        );


        return;
      }


      setPaired(
        false
      );


      setOwner(
        null
      );


      setPairingCode(
        result.code ??
        null
      );


      setPairingExpiresAt(
        result.expires_at ??
        null
      );


      setPairingMessage(
        "Enter this code in the Sentinel dashboard."
      );


      const socket =
        socketRef.current;


      if (
        socket &&
        socket.readyState ===
          WebSocket.OPEN
      ) {
        sendDeviceOnline(
          socket,
          getDeviceToken(),
          deviceName,
        );
      }

    } catch (error) {
      console.error(
        error
      );


      setPairingMessage(
        error instanceof Error
          ? error.message
          : "Pairing failed."
      );
    }
  }


  async function startCamera() {
    try {
      const mediaStream =
        await navigator.mediaDevices
          .getUserMedia({
            video:
              true,

            audio:
              false,
          });


      streamRef.current =
        mediaStream;


      setCameraActive(
        true
      );


      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          mediaStream;
      }


      socketRef.current?.send(
        JSON.stringify({
          type:
            "camera_ready",

          device_id:
            DEVICE.id,
        })
      );


      setConnectionStatus(
        "Camera active"
      );

    } catch (error) {
      console.error(
        "Camera error:",
        error
      );


      setConnectionStatus(
        "Camera error"
      );
    }
  }


  function stopCamera() {
    streamRef.current
      ?.getTracks()
      .forEach(
        (track) => {
          track.stop();
        }
      );


    streamRef.current =
      null;


    setCameraActive(
      false
    );


    if (
      videoRef.current
    ) {
      videoRef.current.srcObject =
        null;
    }


    peerConnectionRef.current
      ?.close();


    peerConnectionRef.current =
      null;


    pendingIceCandidatesRef.current =
      [];


    socketRef.current?.send(
      JSON.stringify({
        type:
          "camera_stopped",

        device_id:
          DEVICE.id,
      })
    );


    setConnectionStatus(
      "Camera stopped"
    );
  }


  async function handleWatchRequest(
    viewerId: string
  ) {
    const stream =
      streamRef.current;


    if (!stream) {
      socketRef.current?.send(
        JSON.stringify({
          type:
            "camera_unavailable",

          target_viewer_id:
            viewerId,

          device_id:
            DEVICE.id,
        })
      );


      return;
    }


    peerConnectionRef.current
      ?.close();


    pendingIceCandidatesRef.current =
      [];


    const peerConnection =
      await createPeerConnection(
        viewerId
      );


    peerConnectionRef.current =
      peerConnection;


    stream
      .getTracks()
      .forEach(
        (track) => {
          peerConnection.addTrack(
            track,
            stream
          );
        }
      );


    const offer =
      await peerConnection
        .createOffer();


    await peerConnection
      .setLocalDescription(
        offer
      );


    socketRef.current?.send(
      JSON.stringify({
        type:
          "webrtc_offer",

        device_id:
          DEVICE.id,

        target_viewer_id:
          viewerId,

        offer:
          peerConnection.localDescription,
      })
    );


    setConnectionStatus(
      "Offer sent"
    );
  }


  async function createPeerConnection(
    viewerId: string
  ) {
    const peerConnection =
      await createConfiguredPeerConnection({
        onIceCandidate:
          (candidate) => {
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
                  "ice_candidate",

                device_id:
                  DEVICE.id,

                target_viewer_id:
                  viewerId,

                candidate:
                  candidate.toJSON(),
              })
            );
          },

        onConnectionStateChange:
          (state) => {
            setConnectionStatus(
              state
            );
          },

        onIceConnectionStateChange:
          (state) => {
            console.log(
              "Emitter ICE state:",
              state
            );
          },
      });


    return peerConnection;
  }

  async function handleAnswer(
    answer:
      RTCSessionDescriptionInit
  ) {
    const peerConnection =
      peerConnectionRef.current;


    if (!peerConnection) {
      return;
    }


    await peerConnection
      .setRemoteDescription(
        answer
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


  if (
    theme === "glass"
  ) {
    return (
      <GlassEmitter
        videoRef={
          videoRef
        }

        deviceName={
          deviceName
        }

        setDeviceNameState={
          setDeviceNameState
        }

        saveDeviceName={
          saveDeviceName
        }

        startCamera={
          startCamera
        }

        stopCamera={
          stopCamera
        }

        cameraActive={
          cameraActive
        }

        connectionStatus={
          connectionStatus
        }

        paired={
          paired
        }

        owner={
          owner
        }

        pairingCode={
          pairingCode
        }

        pairingExpiresAt={
          pairingExpiresAt
        }

        pairingMessage={
          pairingMessage
        }

        createPairingCode={
          createPairingCode
        }
      />
    );
  }


  return (
    <TacticalEmitter
      videoRef={
        videoRef
      }

      deviceName={
        deviceName
      }

      setDeviceNameState={
        setDeviceNameState
      }

      saveDeviceName={
        saveDeviceName
      }

      startCamera={
        startCamera
      }

      stopCamera={
        stopCamera
      }

      cameraActive={
        cameraActive
      }

      connectionStatus={
        connectionStatus
      }

      paired={
        paired
      }

      owner={
        owner
      }

      pairingCode={
        pairingCode
      }

      pairingExpiresAt={
        pairingExpiresAt
      }

      pairingMessage={
        pairingMessage
      }

      createPairingCode={
        createPairingCode
      }
    />
  );
}


interface EmitterViewProps {
  videoRef:
    React.RefObject<HTMLVideoElement | null>;

  deviceName:
    string;

  setDeviceNameState:
    (value: string) => void;

  saveDeviceName:
    () => void;

  startCamera:
    () => void;

  stopCamera:
    () => void;

  cameraActive:
    boolean;

  connectionStatus:
    string;

  paired:
    boolean;

  owner:
    PairingOwner | null;

  pairingCode:
    string | null;

  pairingExpiresAt:
    string | null;

  pairingMessage:
    string;

  createPairingCode:
    () => void;
}


function TacticalEmitter({
  videoRef,
  deviceName,
  setDeviceNameState,
  saveDeviceName,
  startCamera,
  stopCamera,
  cameraActive,
  connectionStatus,
  paired,
  owner,
  pairingCode,
  pairingExpiresAt,
  pairingMessage,
  createPairingCode,
}: EmitterViewProps) {

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
            Console Émetteur //
            Streamer local
          </h1>

          <p
            className="
              text-xs
              font-mono
              text-slate-400
            "
          >
            Configuration du nœud
            de capture vidéo
          </p>
        </div>
      </div>


      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-3
          gap-6
          font-mono
        "
      >
        <div
          className="
            lg:col-span-2
            panel-tactical
            rounded
            p-4
            space-y-4
          "
        >
          <div
            className="
              relative
              aspect-video
              bg-black
              rounded
              border
              border-tactical-border
              flex
              items-center
              justify-center
              overflow-hidden
            "
          >
            <video
              ref={
                videoRef
              }

              autoPlay

              playsInline

              muted

              className="
                absolute
                inset-0
                w-full
                h-full
                object-cover
              "
            />


            <div
              className="
                absolute
                top-3
                left-3
                text-[10px]
                text-emerald-400
                bg-black/80
                px-2
                py-1
                border
                border-emerald-500/30
                z-10
              "
            >
              SIGNAL:
              {" "}

              {cameraActive
                ? "WEBRTC_ACTIVE"
                : "STANDBY"}
            </div>


            {!cameraActive && (
              <div
                className="
                  w-20
                  h-20
                  border
                  border-emerald-500/40
                  rounded
                  flex
                  items-center
                  justify-center
                  text-emerald-500/60
                  text-xs
                  z-10
                "
              >
                [ + ]
              </div>
            )}
          </div>


          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >
            <div
              className="
                flex
                gap-2
              "
            >
              <button
                onClick={
                  startCamera
                }

                disabled={
                  cameraActive
                }

                className="
                  px-4
                  py-2
                  bg-emerald-600
                  hover:bg-emerald-500
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  text-black
                  font-bold
                  text-xs
                  rounded
                  transition-colors
                  uppercase
                "
              >
                Démarrer Capture
              </button>


              <button
                onClick={
                  stopCamera
                }

                disabled={
                  !cameraActive
                }

                className="
                  px-4
                  py-2
                  bg-tactical-800
                  hover:bg-slate-700
                  disabled:opacity-40
                  disabled:cursor-not-allowed
                  text-slate-300
                  text-xs
                  rounded
                  border
                  border-tactical-border
                  uppercase
                "
              >
                Couper
              </button>
            </div>


            <span
              className="
                text-xs
                text-slate-400
              "
            >
              ID NŒUD:
              {" "}

              {DEVICE.id.slice(
                0,
                8
              )}
            </span>
          </div>


          <div
            className="
              flex
              items-center
              justify-between
              text-[10px]
              text-slate-500
              border-t
              border-tactical-border
              pt-3
            "
          >
            <span>
              WEBRTC:
              {" "}
              {connectionStatus}
            </span>

            <span>
              CAMERA:
              {" "}
              {cameraActive
                ? "ACTIVE"
                : "OFFLINE"}
            </span>
          </div>
        </div>


        <div
          className="
            space-y-4
          "
        >
          <div
            className="
              panel-tactical
              p-4
              rounded
              space-y-3
            "
          >
            <h2
              className="
                text-xs
                font-bold
                text-white
                uppercase
                border-b
                border-tactical-border
                pb-2
              "
            >
              Identité de la station
            </h2>


            <div
              className="
                space-y-2
              "
            >
              <label
                className="
                  text-[10px]
                  text-slate-400
                "
              >
                NOM RECONNU
              </label>


              <input
                type="text"

                value={
                  deviceName
                }

                onChange={(
                  event
                ) =>
                  setDeviceNameState(
                    event.target.value
                  )
                }

                className="
                  w-full
                  px-3
                  py-1.5
                  bg-black
                  border
                  border-tactical-border
                  text-xs
                  text-emerald-400
                  focus:outline-none
                  focus:border-emerald-500
                "
              />
            </div>


            <button
              onClick={
                saveDeviceName
              }

              className="
                w-full
                py-1.5
                bg-tactical-800
                hover:bg-slate-700
                text-slate-200
                text-xs
                rounded
                border
                border-tactical-border
              "
            >
              Mettre à jour
            </button>
          </div>


          <div
            className="
              panel-tactical
              p-4
              rounded
              space-y-3
              border-l-2
              border-l-emerald-500
            "
          >
            <h2
              className="
                text-xs
                font-bold
                text-white
                uppercase
              "
            >
              Association Tableau
              de Bord
            </h2>


            <p
              className="
                text-[11px]
                text-slate-400
              "
            >
              {paired
                ? "Cet émetteur est associé à un compte Sentinel."
                : "Code à usage unique pour l'appairage distant."}
            </p>


            {paired ? (
              <div
                className="
                  p-3
                  bg-black
                  border
                  border-emerald-500/30
                  rounded
                  space-y-2
                "
              >
                <span
                  className="
                    text-[10px]
                    text-emerald-500/80
                    block
                  "
                >
                  COMPTE ASSOCIÉ
                </span>


                <span
                  className="
                    text-base
                    font-bold
                    text-emerald-400
                  "
                >
                  {owner?.username ??
                    "Unknown"}
                </span>


                {owner?.email && (
                  <p
                    className="
                      text-[10px]
                      text-slate-400
                    "
                  >
                    {owner.email}
                  </p>
                )}
              </div>
            ) : (
              <>
                {pairingCode ? (
                  <div
                    className="
                      p-3
                      bg-black
                      border
                      border-emerald-500/30
                      rounded
                      text-center
                    "
                  >
                    <span
                      className="
                        text-[10px]
                        text-emerald-500/80
                        block
                      "
                    >
                      CODE CLÉ
                    </span>


                    <span
                      className="
                        text-xl
                        font-bold
                        text-emerald-400
                        tracking-widest
                      "
                    >
                      {formatPairingCode(
                        pairingCode
                      )}
                    </span>


                    {pairingExpiresAt && (
                      <p
                        className="
                          text-[9px]
                          text-slate-500
                          mt-2
                        "
                      >
                        EXP:
                        {" "}

                        {new Date(
                          pairingExpiresAt
                        ).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={
                      createPairingCode
                    }

                    className="
                      w-full
                      py-2
                      bg-emerald-600
                      hover:bg-emerald-500
                      text-black
                      font-bold
                      text-xs
                      rounded
                      uppercase
                    "
                  >
                    Générer un code
                  </button>
                )}
              </>
            )}


            {pairingMessage && (
              <p
                className="
                  text-[10px]
                  text-slate-400
                "
              >
                {pairingMessage}
              </p>
            )}
          </div>


          <div
            className="
              panel-tactical
              p-4
              rounded
              space-y-2
            "
          >
            <h2
              className="
                text-xs
                font-bold
                text-white
                uppercase
              "
            >
              État du terminal
            </h2>


            <div
              className="
                flex
                justify-between
                text-[10px]
              "
            >
              <span
                className="
                  text-slate-400
                "
              >
                PAIRING
              </span>

              <span
                className={
                  paired
                    ? "text-emerald-400"
                    : "text-amber-400"
                }
              >
                {paired
                  ? "PAIRED"
                  : "UNPAIRED"}
              </span>
            </div>


            <div
              className="
                flex
                justify-between
                text-[10px]
              "
            >
              <span
                className="
                  text-slate-400
                "
              >
                VIDEO
              </span>

              <span
                className={
                  cameraActive
                    ? "text-emerald-400"
                    : "text-slate-500"
                }
              >
                {cameraActive
                  ? "ACTIVE"
                  : "STANDBY"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function GlassEmitter({
  videoRef,
  deviceName,
  setDeviceNameState,
  saveDeviceName,
  startCamera,
  stopCamera,
  cameraActive,
  connectionStatus,
  paired,
  owner,
  pairingCode,
  pairingExpiresAt,
  pairingMessage,
  createPairingCode,
}: EmitterViewProps) {

  return (
    <div
      className="
        space-y-8
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
          Émetteur
        </h1>

        <p
          className="
            text-sm
            text-muted
            mt-1
          "
        >
          Transmettre le flux vidéo
          de cet appareil
        </p>
      </div>


      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-6
        "
      >
        <div
          className="
            md:col-span-2
            glass-card
            rounded-3xl
            p-4
            space-y-4
          "
        >
          <div
            className="
              aspect-video
              bg-black
              rounded-2xl
              flex
              items-center
              justify-center
              relative
              overflow-hidden
            "
          >
            <video
              ref={
                videoRef
              }

              autoPlay

              playsInline

              muted

              className="
                absolute
                inset-0
                w-full
                h-full
                object-cover
              "
            />


            {!cameraActive && (
              <span
                className="
                  text-xs
                  text-white/50
                  z-10
                "
              >
                Aperçu Caméra
              </span>
            )}


            <span
              className="
                inline-flex
                items-center
                gap-1.5
                absolute
                top-3
                left-3
                px-3
                py-1
                rounded-full
                bg-black/40
                backdrop-blur-md
                text-white
                text-[11px]
                font-medium
                z-10
              "
            >
              <span
                className={
                  cameraActive
                    ? "w-1.5 h-1.5 rounded-full bg-emerald-400"
                    : "w-1.5 h-1.5 rounded-full bg-white/30"
                }
              />

              {cameraActive
                ? "En direct"
                : "Inactif"}
            </span>
          </div>


          <div
            className="
              flex
              justify-between
              items-center
              px-1
              gap-3
            "
          >
            <div
              className="
                flex
                gap-2
              "
            >
              {!cameraActive ? (
                <button
                  onClick={
                    startCamera
                  }

                  className="
                    px-5
                    py-2
                    rounded-full
                    btn-primary
                    text-xs
                    font-medium
                    transition-all
                  "
                >
                  Démarrer la caméra
                </button>
              ) : (
                <button
                  onClick={
                    stopCamera
                  }

                  className="
                    px-5
                    py-2
                    rounded-full
                    bg-rose-500
                    hover:bg-rose-600
                    text-white
                    text-xs
                    font-medium
                    transition-all
                  "
                >
                  Arrêter la caméra
                </button>
              )}
            </div>


            <span
              className="
                text-xs
                text-muted
              "
            >
              {connectionStatus}
            </span>
          </div>
        </div>


        <div
          className="
            space-y-6
          "
        >
          <div
            className="
              glass-card
              rounded-3xl
              p-5
              space-y-3
            "
          >
            <label
              className="
                text-xs
                font-medium
                text-muted
                block
              "
            >
              Nom de l'appareil
            </label>


            <input
              type="text"

              value={
                deviceName
              }

              onChange={(
                event
              ) =>
                setDeviceNameState(
                  event.target.value
                )
              }

              className="
                glass-input
                w-full
                px-3.5
                py-2
                rounded-xl
                text-xs
                font-medium
                focus:outline-none
              "
            />


            <button
              onClick={
                saveDeviceName
              }

              className="
                w-full
                py-2
                rounded-xl
                btn-solid
                text-xs
                font-medium
              "
            >
              Enregistrer
            </button>
          </div>


          <div
            className="
              glass-card
              rounded-3xl
              p-5
              space-y-2
              text-center
            "
          >
            {paired ? (
              <>
                <span
                  className="
                    text-xs
                    text-muted
                  "
                >
                  Compte associé
                </span>

                <p
                  className="
                    text-xl
                    font-semibold
                  "
                >
                  {owner?.username ??
                    "Unknown"}
                </p>

                {owner?.email && (
                  <p
                    className="
                      text-xs
                      text-muted
                    "
                  >
                    {owner.email}
                  </p>
                )}
              </>
            ) : pairingCode ? (
              <>
                <span
                  className="
                    text-xs
                    text-muted
                  "
                >
                  Code d'appairage
                </span>

                <p
                  className="
                    text-2xl
                    font-semibold
                    tracking-widest
                  "
                >
                  {formatPairingCode(
                    pairingCode
                  )}
                </p>

                {pairingExpiresAt && (
                  <p
                    className="
                      text-[10px]
                      text-muted
                    "
                  >
                    Expire à
                    {" "}

                    {new Date(
                      pairingExpiresAt
                    ).toLocaleTimeString()}
                  </p>
                )}
              </>
            ) : (
              <>
                <span
                  className="
                    text-xs
                    text-muted
                  "
                >
                  Aucun compte associé
                </span>

                <button
                  onClick={
                    createPairingCode
                  }

                  className="
                    w-full
                    py-2
                    rounded-xl
                    btn-primary
                    text-xs
                    font-medium
                    mt-2
                  "
                >
                  Générer un code
                </button>
              </>
            )}


            {pairingMessage && (
              <p
                className="
                  text-[10px]
                  text-muted
                  pt-1
                "
              >
                {pairingMessage}
              </p>
            )}
          </div>


          <div
            className="
              glass-card
              rounded-3xl
              p-5
              space-y-2
            "
          >
            <div
              className="
                flex
                justify-between
                text-xs
              "
            >
              <span
                className="
                  text-muted
                "
              >
                Device ID
              </span>

              <span>
                {DEVICE.id.slice(
                  0,
                  8
                )}
                ...
              </span>
            </div>


            <div
              className="
                flex
                justify-between
                text-xs
              "
            >
              <span
                className="
                  text-muted
                "
              >
                Pairing
              </span>

              <span>
                {paired
                  ? "Paired"
                  : "Not paired"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function formatPairingCode(
  code: string
) {
  const clean =
    code.replace(
      /\D/g,
      ""
    );


  if (
    clean.length !== 6
  ) {
    return code;
  }


  return `${clean.slice(
    0,
    3
  )}-${clean.slice(3)}`;
}


export default EmitterPage;