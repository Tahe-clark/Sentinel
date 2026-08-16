import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createSignalingSocket,
} from "../../services/signaling";

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


const DEVICE =
  getDeviceIdentity();


function EmitterPage() {
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


  const [cameraActive, setCameraActive] =
    useState(false);

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
    const socket =
      createSignalingSocket(
        "emitter"
      );


    socketRef.current =
      socket;


    socket.onopen = () => {
      const token =
        getDeviceToken();


      sendDeviceOnline(
        socket,
        token,
        DEVICE.name
      );
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

          return;
        }


        if (
          data.type ===
          "device_authentication_error"
        ) {
          setConnectionStatus(
            "Device authentication failed"
          );

          console.error(
            data.message
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
            "This device was deleted from Sentinel. You can pair it again to recreate it."
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
          "watch_device"
        ) {
          if (
            data.target_device_id ===
            DEVICE.id
          ) {
            await handleWatchRequest(
              data.viewer_id
            );
          }

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
        "WebSocket error:",
        error
      );
    };


    socket.onclose = () => {
      setConnectionStatus(
        "Signaling disconnected"
      );
    };


    return () => {
      socket.close();


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


      if (result.paired) {
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
        "Enter this code in the Sentinel dashboard you want to connect this device to."
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
        "Pairing error:",
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


      console.log(
        "Camera started"
      );

    } catch (error) {
      console.error(
        "Camera error:",
        error
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
      createPeerConnection(
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


  function createPeerConnection(
    viewerId: string
  ) {
    const peerConnection =
      new RTCPeerConnection({
        iceServers: [
          {
            urls:
              "stun:stun.l.google.com:19302",
          },
        ],
      });


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

            device_id:
              DEVICE.id,

            target_viewer_id:
              viewerId,

            candidate:
              event.candidate.toJSON(),
          })
        );
      };


    peerConnection.onconnectionstatechange =
      () => {
        setConnectionStatus(
          peerConnection
            .connectionState
        );
      };


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


    if (!peerConnection) {
      return;
    }


    if (
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
    <main>
      <h1>
        Emitter
      </h1>


      <section>
        <h2>
          Device
        </h2>


        <p>
          Device ID:
          {" "}
          {DEVICE.id}
        </p>


        <label>
          Device name
        </label>


        <input
          value={
            deviceName
          }

          onChange={(
            event
          ) => {
            setDeviceNameState(
              event.target.value
            );
          }}
        />


        <button
          onClick={
            saveDeviceName
          }
        >
          Save Name
        </button>
      </section>


      <hr />


      <section>
        <h2>
          Sentinel Account
        </h2>


        <p>
          Status:
          {" "}

          <strong>
            {paired
              ? "🟢 Paired"
              : "⚫ Not paired"}
          </strong>
        </p>


        {owner ? (
          <>
            <p>
              Owner:
              {" "}

              <strong>
                {owner.username}
              </strong>
            </p>


            {owner.email && (
              <p>
                Email:
                {" "}
                {owner.email}
              </p>
            )}
          </>
        ) : (
          <p>
            Owner:
            {" "}
            None
          </p>
        )}
      </section>


      <hr />


      <section>
        <h2>
          Device Pairing
        </h2>


        {!paired && (
          <button
            onClick={
              createPairingCode
            }
          >
            Pair this device
          </button>
        )}


        {paired && (
          <p>
            To connect this device
            to another account,
            unpair it from its
            current Dashboard first.
          </p>
        )}


        {pairingCode && (
          <div>
            <h3>
              Pairing Code
            </h3>


            <strong>
              {pairingCode}
            </strong>


            {pairingExpiresAt && (
              <p>
                Expires:
                {" "}

                {new Date(
                  pairingExpiresAt
                ).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}


        {pairingMessage && (
          <p>
            {pairingMessage}
          </p>
        )}
      </section>


      <hr />


      <section>
        <h2>
          Camera
        </h2>


        <p>
          Camera:
          {" "}

          {cameraActive
            ? "🟢 Active"
            : "⚫ Inactive"}
        </p>


        <p>
          WebRTC:
          {" "}
          {connectionStatus}
        </p>


        <button
          onClick={
            startCamera
          }

          disabled={
            cameraActive
          }
        >
          Start Camera
        </button>


        <button
          onClick={
            stopCamera
          }

          disabled={
            !cameraActive
          }
        >
          Stop Camera
        </button>


        <div>
          <video
            ref={
              videoRef
            }

            autoPlay

            playsInline

            muted

            style={{
              width:
                "600px",

              maxWidth:
                "100%",

              background:
                "black",
            }}
          />
        </div>
      </section>
    </main>
  );
}


export default EmitterPage;