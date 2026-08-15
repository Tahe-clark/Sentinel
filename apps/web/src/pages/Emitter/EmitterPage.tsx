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
  setDeviceName,
} from "../../services/deviceIdentity";

import {
  requestPairing,
} from "../../services/pairing";


const DEVICE = getDeviceIdentity();


function EmitterPage() {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const socketRef =
    useRef<WebSocket | null>(null);

  const peerConnectionRef =
    useRef<RTCPeerConnection | null>(null);

  const currentViewerRef =
    useRef<string | null>(null);

  const pendingIceCandidatesRef =
    useRef<RTCIceCandidateInit[]>([]);


  const [cameraActive, setCameraActive] =
    useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState("Waiting");

  const [deviceName, setDeviceNameState] =
    useState(DEVICE.name);

  const [pairingCode, setPairingCode] =
    useState<string | null>(null);

  const [
    pairingExpiresAt,
    setPairingExpiresAt,
  ] = useState<string | null>(null);

  const [
    pairingMessage,
    setPairingMessage,
  ] = useState("");


  useEffect(() => {
    console.log(
      "EMITTER DEVICE ID:",
      DEVICE.id
    );

    console.log(
      "EMITTER DEVICE NAME:",
      DEVICE.name
    );


    const socket =
      createSignalingSocket();

    socketRef.current =
      socket;


    socket.onopen = () => {
      console.log(
        "✅ Emitter connected to signaling server"
      );

      socket.send(
        JSON.stringify({
          type: "device_online",
          device_id: DEVICE.id,
          device_name: DEVICE.name,
        })
      );
    };


    socket.onmessage =
      async (event) => {
        const data =
          JSON.parse(event.data);


        console.log(
          "📩 EMITTER RECEIVED:",
          data
        );


        /*
         * Viewer asks to watch a device.
         */
        if (
          data.type ===
          "watch_device"
        ) {
          console.log(
            "WATCH REQUEST TARGET:",
            data.target_device_id
          );

          console.log(
            "THIS EMITTER ID:",
            DEVICE.id
          );


          if (
            data.target_device_id ===
            DEVICE.id
          ) {
            console.log(
              "✅ DEVICE MATCH"
            );

            await handleWatchRequest(
              data.viewer_id
            );
          } else {
            console.warn(
              "❌ DEVICE ID DOES NOT MATCH"
            );
          }
        }


        /*
         * Viewer answered our WebRTC offer.
         */
        if (
          data.type ===
            "webrtc_answer" &&
          data.target_device_id ===
            DEVICE.id
        ) {
          console.log(
            "📩 WebRTC answer received"
          );

          await handleAnswer(
            data.answer
          );
        }


        /*
         * ICE candidate sent by viewer.
         */
        if (
          data.type ===
            "ice_candidate" &&
          data.target_device_id ===
            DEVICE.id
        ) {
          console.log(
            "🧊 Remote ICE candidate received"
          );

          await handleRemoteIceCandidate(
            data.candidate
          );
        }
      };


    socket.onerror = (error) => {
      console.error(
        "❌ WebSocket error:",
        error
      );
    };


    socket.onclose = () => {
      console.log(
        "🔌 Emitter disconnected from signaling server"
      );

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
        .forEach((track) => {
          track.stop();
        });
    };
  }, []);


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


    socketRef.current?.send(
      JSON.stringify({
        type: "device_online",
        device_id: DEVICE.id,
        device_name: cleanName,
      })
    );


    console.log(
      "Device renamed:",
      cleanName
    );
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
        );


      if (result.paired) {
        setPairingMessage(
          "This device is already paired."
        );

        setPairingCode(null);

        setPairingExpiresAt(null);

        return;
      }


      setPairingCode(
        result.code ?? null
      );

      setPairingExpiresAt(
        result.expires_at ?? null
      );

      setPairingMessage(
        "Enter this code in your Sentinel dashboard."
      );
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
      console.log(
        "📷 Requesting camera..."
      );


      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });


      streamRef.current =
        mediaStream;

      setCameraActive(
        true
      );


      if (videoRef.current) {
        videoRef.current.srcObject =
          mediaStream;
      }


      socketRef.current?.send(
        JSON.stringify({
          type: "camera_ready",
          device_id: DEVICE.id,
        })
      );


      console.log(
        "✅ Camera started"
      );

      console.log(
        "Camera tracks:",
        mediaStream.getTracks()
      );
    } catch (error) {
      console.error(
        "❌ Camera error:",
        error
      );
    }
  }


  function stopCamera() {
    streamRef.current
      ?.getTracks()
      .forEach((track) => {
        track.stop();
      });


    streamRef.current =
      null;

    setCameraActive(
      false
    );


    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }


    peerConnectionRef.current
      ?.close();

    peerConnectionRef.current =
      null;


    currentViewerRef.current =
      null;

    pendingIceCandidatesRef.current =
      [];


    socketRef.current?.send(
      JSON.stringify({
        type: "camera_stopped",
        device_id: DEVICE.id,
      })
    );


    setConnectionStatus(
      "Camera stopped"
    );


    console.log(
      "🛑 Camera stopped"
    );
  }


  async function handleWatchRequest(
    viewerId: string
  ) {
    console.log(
      "👁 Viewer wants this camera:",
      viewerId
    );


    const stream =
      streamRef.current;


    if (!stream) {
      console.warn(
        "⚠️ Camera is not active"
      );


      socketRef.current?.send(
        JSON.stringify({
          type: "camera_unavailable",

          target_viewer_id:
            viewerId,

          device_id:
            DEVICE.id,
        })
      );


      return;
    }


    console.log(
      "✅ Camera stream exists"
    );


    currentViewerRef.current =
      viewerId;


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
      .forEach((track) => {
        console.log(
          "Adding track:",
          track.kind
        );

        peerConnection.addTrack(
          track,
          stream
        );
      });


    console.log(
      "Creating WebRTC offer..."
    );


    const offer =
      await peerConnection
        .createOffer();


    await peerConnection
      .setLocalDescription(
        offer
      );


    console.log(
      "📤 Sending WebRTC offer"
    );


    socketRef.current?.send(
      JSON.stringify({
        type: "webrtc_offer",

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


    console.log(
      "✅ OFFER SENT"
    );
  }


  function createPeerConnection(
    viewerId: string
  ) {
    console.log(
      "Creating emitter RTCPeerConnection"
    );


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
        if (!event.candidate) {
          console.log(
            "ICE gathering complete"
          );

          return;
        }


        console.log(
          "🧊 Emitter ICE candidate:",
          event.candidate.candidate
        );


        socketRef.current?.send(
          JSON.stringify({
            type: "ice_candidate",

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
        console.log(
          "🔗 EMITTER WebRTC state:",
          peerConnection.connectionState
        );


        setConnectionStatus(
          peerConnection.connectionState
        );


        if (
          peerConnection.connectionState ===
            "failed" ||
          peerConnection.connectionState ===
            "closed"
        ) {
          currentViewerRef.current =
            null;
        }
      };


    peerConnection.oniceconnectionstatechange =
      () => {
        console.log(
          "🧊 Emitter ICE state:",
          peerConnection.iceConnectionState
        );
      };


    peerConnection.onicegatheringstatechange =
      () => {
        console.log(
          "🧊 Emitter ICE gathering:",
          peerConnection.iceGatheringState
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
      console.warn(
        "No peer connection for answer"
      );

      return;
    }


    console.log(
      "Setting remote answer..."
    );


    await peerConnection
      .setRemoteDescription(
        answer
      );


    console.log(
      "✅ Remote answer accepted"
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
      console.warn(
        "ICE candidate arrived before peer connection"
      );

      return;
    }


    if (
      !peerConnection
        .remoteDescription
    ) {
      console.log(
        "Queueing remote ICE candidate"
      );


      pendingIceCandidatesRef.current.push(
        candidate
      );


      return;
    }


    await peerConnection
      .addIceCandidate(
        candidate
      );


    console.log(
      "✅ Remote ICE candidate added"
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
          value={deviceName}

          onChange={(event) => {
            setDeviceNameState(
              event.target.value
            );
          }}
        />


        <button
          onClick={saveDeviceName}
        >
          Save Name
        </button>


        <p>
          Current name:
          {" "}
          {deviceName}
        </p>
      </section>


      <hr />


      <section>
        <h2>
          Device Pairing
        </h2>


        <button
          onClick={
            createPairingCode
          }
        >
          Pair this device
        </button>


        {pairingCode && (
          <div>
            <h3>
              Pairing Code
            </h3>


            <strong>
              {pairingCode}
            </strong>


            <p>
              {pairingMessage}
            </p>


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


        {!pairingCode &&
          pairingMessage && (
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
            ref={videoRef}

            autoPlay

            playsInline

            muted

            style={{
              width: "600px",
              maxWidth: "100%",
              background: "black",
            }}
          />
        </div>
      </section>
    </main>
  );
}


export default EmitterPage;