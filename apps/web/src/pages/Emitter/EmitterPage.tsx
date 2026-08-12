import {
  useEffect,
  useRef,
  useState,
} from "react";

import { createSignalingSocket } from "../../services/signaling";


const DEVICE_ID = "pc-test";
const DEVICE_NAME = "PC-Test";


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


  useEffect(() => {
    const socket = createSignalingSocket();

    socketRef.current = socket;


    socket.onopen = () => {
      console.log(
        "Emitter connected to signaling server"
      );

      socket.send(
        JSON.stringify({
          type: "device_online",
          device_id: DEVICE_ID,
          device_name: DEVICE_NAME,
        })
      );
    };


    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      console.log(
        "Emitter received:",
        data
      );


      if (
        data.type === "watch_device" &&
        data.target_device_id === DEVICE_ID
      ) {
        await handleWatchRequest(
          data.viewer_id
        );
      }


      if (
        data.type === "webrtc_answer" &&
        data.target_device_id === DEVICE_ID
      ) {
        await handleAnswer(
          data.answer
        );
      }


      if (
        data.type === "ice_candidate" &&
        data.target_device_id === DEVICE_ID
      ) {
        await handleRemoteIceCandidate(
          data.candidate
        );
      }
    };


    socket.onerror = (error) => {
      console.error(
        "WebSocket error:",
        error
      );
    };


    return () => {
      socket.close();

      peerConnectionRef.current?.close();
    };
  }, []);


  async function startCamera() {
    try {
      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

      streamRef.current =
        mediaStream;

      setCameraActive(true);


      if (videoRef.current) {
        videoRef.current.srcObject =
          mediaStream;
      }
      
      socketRef.current?.send(
  JSON.stringify({
    type: "camera_ready",
    device_id: DEVICE_ID,
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
      .forEach((track) => {
        track.stop();
      });


    streamRef.current = null;

    setCameraActive(false);


    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }


    peerConnectionRef.current
      ?.close();

    peerConnectionRef.current =
      null;

    socketRef.current?.send(
    JSON.stringify({
        type: "camera_stopped",
        device_id: DEVICE_ID,
    })
    );
    
    setConnectionStatus(
      "Camera stopped"
    );
  }


  async function handleWatchRequest(
    viewerId: string
  ) {
    console.log(
      "Viewer wants this camera:",
      viewerId
    );


    const stream =
      streamRef.current;


    if (!stream) {
      console.warn(
        "Camera is not active"
      );

      socketRef.current?.send(
        JSON.stringify({
          type: "camera_unavailable",
          target_viewer_id: viewerId,
          device_id: DEVICE_ID,
        })
      );

      return;
    }


    currentViewerRef.current =
      viewerId;


    peerConnectionRef.current
      ?.close();


    const peerConnection =
      createPeerConnection(
        viewerId
      );


    peerConnectionRef.current =
      peerConnection;


    stream
      .getTracks()
      .forEach((track) => {
        peerConnection.addTrack(
          track,
          stream
        );
      });


    const offer =
      await peerConnection.createOffer();


    await peerConnection
      .setLocalDescription(offer);


    socketRef.current?.send(
      JSON.stringify({
        type: "webrtc_offer",

        device_id: DEVICE_ID,

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
        iceServers: [],
      });


    peerConnection.onicecandidate =
      (event) => {
        if (!event.candidate) {
          return;
        }


        socketRef.current?.send(
          JSON.stringify({
            type: "ice_candidate",

            device_id:
              DEVICE_ID,

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
          "WebRTC state:",
          peerConnection.connectionState
        );


        setConnectionStatus(
          peerConnection.connectionState
        );
      };


    return peerConnection;
  }


  async function handleAnswer(
    answer: RTCSessionDescriptionInit
  ) {
    const peerConnection =
      peerConnectionRef.current;


    if (!peerConnection) {
      return;
    }


    await peerConnection
      .setRemoteDescription(answer);


    console.log(
      "Remote answer accepted"
    );


    for (
      const candidate
      of pendingIceCandidatesRef.current
    ) {
      await peerConnection
        .addIceCandidate(candidate);
    }


    pendingIceCandidatesRef.current =
      [];
  }


  async function handleRemoteIceCandidate(
    candidate: RTCIceCandidateInit
  ) {
    const peerConnection =
      peerConnectionRef.current;


    if (!peerConnection) {
      return;
    }


    if (
      !peerConnection.remoteDescription
    ) {
      pendingIceCandidatesRef.current.push(
        candidate
      );

      return;
    }


    await peerConnection
      .addIceCandidate(candidate);
  }


  return (
    <main>
      <h1>Emitter</h1>

      <p>
        Device: {DEVICE_NAME}
      </p>

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
        onClick={startCamera}
        disabled={cameraActive}
      >
        Start Camera
      </button>


      <button
        onClick={stopCamera}
        disabled={!cameraActive}
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
          }}
        />
      </div>
    </main>
  );
}


export default EmitterPage;