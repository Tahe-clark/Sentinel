import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  createSignalingSocket,
} from "../../services/signaling";


function DevicePage() {
  const { deviceId } =
    useParams();


  const videoRef =
    useRef<HTMLVideoElement>(null);


  const socketRef =
    useRef<WebSocket | null>(null);


  const peerConnectionRef =
    useRef<RTCPeerConnection | null>(
      null
    );


  const viewerIdRef =
    useRef(
      crypto.randomUUID()
    );


  const pendingIceCandidatesRef =
    useRef<RTCIceCandidateInit[]>(
      []
    );


  const [status, setStatus] =
    useState("Connecting...");


  useEffect(() => {
    if (!deviceId) {
      return;
    }


    const socket =
      createSignalingSocket();


    socketRef.current =
      socket;


    socket.onopen = () => {
  console.log(
    "Viewer connected to signaling"
  );

  requestCamera();
};


    socket.onmessage =
      async (event) => {
        const data =
          JSON.parse(event.data);


        console.log(
          "Viewer received:",
          data
        );


        if (
          data.type ===
            "webrtc_offer" &&

          data.target_viewer_id ===
            viewerIdRef.current
        ) {
          await handleOffer(
            data.offer
          );
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
        }
        
        if (
        data.type === "camera_ready" &&
        data.device_id === deviceId
        ) {
        console.log(
            "Camera became available"
        );

          requestCamera();
        }

        if (
          data.type ===
            "camera_unavailable" &&

          data.target_viewer_id ===
            viewerIdRef.current
        ) {
          setStatus(
            "Camera is not active"
          );
        }

        if (
            data.type === "camera_stopped" &&
            data.device_id === deviceId
            ) {
            setStatus(
                "Camera stopped"
            );

            peerConnectionRef.current
                ?.close();

            peerConnectionRef.current =
                null;

            if (videoRef.current) {
                videoRef.current.srcObject =
                null;
            }
            }
      };

      


    socket.onerror =
      (error) => {
        console.error(
          "Viewer socket error:",
          error
        );


        setStatus(
          "Signaling error"
        );
      };


    return () => {
      socket.close();

      peerConnectionRef.current
        ?.close();
    };
  }, [deviceId]);

  function requestCamera() {
  const socket =
    socketRef.current;

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN ||
    !deviceId
  ) {
    return;
  }

  const peerConnection =
    peerConnectionRef.current;

  if (
    peerConnection &&
    (
      peerConnection.connectionState ===
        "connected" ||
      peerConnection.connectionState ===
        "connecting"
    )
  ) {
    return;
  }

  console.log(
    "Requesting camera:",
    deviceId
  );

  socket.send(
    JSON.stringify({
      type: "watch_device",

      viewer_id:
        viewerIdRef.current,

      target_device_id:
        deviceId,
    })
  );

  setStatus(
    "Requesting camera..."
  );
 }

  function createPeerConnection() {
    const peerConnection =
      new RTCPeerConnection({
        iceServers: [],
      });


    peerConnection.ontrack =
      (event) => {
        console.log(
          "Remote video received"
        );


        const remoteStream =
          event.streams[0];


        if (
          videoRef.current &&
          remoteStream
        ) {
          videoRef.current.srcObject =
            remoteStream;
        }
      };


    peerConnection.onicecandidate =
      (event) => {
        if (!event.candidate) {
          return;
        }


        socketRef.current?.send(
          JSON.stringify({
            type:
              "ice_candidate",

            viewer_id:
              viewerIdRef.current,

            target_device_id:
              deviceId,

            candidate:
              event.candidate.toJSON(),
          })
        );
      };


    peerConnection.onconnectionstatechange =
      () => {
        console.log(
          "Viewer WebRTC:",
          peerConnection.connectionState
        );


        setStatus(
          peerConnection.connectionState
        );
      };


    return peerConnection;
  }


  async function handleOffer(
    offer: RTCSessionDescriptionInit
  ) {
    console.log(
      "WebRTC offer received"
    );


    peerConnectionRef.current
      ?.close();


    const peerConnection =
      createPeerConnection();


    peerConnectionRef.current =
      peerConnection;


    await peerConnection
      .setRemoteDescription(offer);


    for (
      const candidate
      of pendingIceCandidatesRef.current
    ) {
      await peerConnection
        .addIceCandidate(candidate);
    }


    pendingIceCandidatesRef.current =
      [];


    const answer =
      await peerConnection
        .createAnswer();


    await peerConnection
      .setLocalDescription(answer);


    socketRef.current?.send(
      JSON.stringify({
        type:
          "webrtc_answer",

        viewer_id:
          viewerIdRef.current,

        target_device_id:
          deviceId,

        answer:
          peerConnection.localDescription,
      })
    );


    setStatus(
      "Answer sent"
    );
  }


  async function handleRemoteIceCandidate(
    candidate: RTCIceCandidateInit
  ) {
    const peerConnection =
      peerConnectionRef.current;


    if (
      !peerConnection ||
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
      <h1>
        Live Device
      </h1>


      <p>
        Device ID:
        {" "}
        {deviceId}
      </p>


      <p>
        Status:
        {" "}
        {status}
      </p>


      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "700px",
          maxWidth: "100%",
          background: "black",
        }}
      />
    </main>
  );
}


export default DevicePage;