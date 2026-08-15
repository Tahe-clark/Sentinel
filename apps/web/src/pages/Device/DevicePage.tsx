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
  const {
    deviceId,
  } = useParams();


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
    useRef<
      RTCIceCandidateInit[]
    >([]);


  const [status, setStatus] =
    useState(
      "Connecting to signaling..."
    );


  useEffect(() => {
    if (!deviceId) {
      console.error(
        "❌ No device ID in URL"
      );

      setStatus(
        "Invalid device"
      );

      return;
    }


    console.log(
      "VIEWER ID:",
      viewerIdRef.current
    );

    console.log(
      "VIEWER TARGET DEVICE:",
      deviceId
    );


    const socket =
      createSignalingSocket();


    socketRef.current =
      socket;


    socket.onopen = () => {
      console.log(
        "✅ Viewer connected to signaling"
      );


      requestCamera();
    };


    socket.onmessage =
      async (event) => {
        const data =
          JSON.parse(event.data);


        console.log(
          "📩 VIEWER RECEIVED:",
          data
        );


        if (
          data.type ===
            "camera_ready" &&
          data.device_id ===
            deviceId
        ) {
          console.log(
            "📷 Camera became ready"
          );


          requestCamera();
        }


        if (
          data.type ===
            "webrtc_offer" &&
          data.target_viewer_id ===
            viewerIdRef.current
        ) {
          console.log(
            "✅ WebRTC offer received"
          );


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
          console.log(
            "🧊 Viewer received remote ICE candidate"
          );


          await handleRemoteIceCandidate(
            data.candidate
          );
        }


        if (
          data.type ===
            "camera_unavailable" &&
          data.target_viewer_id ===
            viewerIdRef.current
        ) {
          console.log(
            "⚠️ Camera unavailable"
          );


          setStatus(
            "Waiting for camera..."
          );
        }


        if (
          data.type ===
            "camera_stopped" &&
          data.device_id ===
            deviceId
        ) {
          console.log(
            "🛑 Remote camera stopped"
          );


          peerConnectionRef.current
            ?.close();


          peerConnectionRef.current =
            null;


          pendingIceCandidatesRef.current =
            [];


          if (
            videoRef.current
          ) {
            videoRef.current.srcObject =
              null;
          }


          setStatus(
            "Camera stopped"
          );
        }
      };


    socket.onerror =
      (error) => {
        console.error(
          "❌ Viewer WebSocket error:",
          error
        );


        setStatus(
          "Signaling error"
        );
      };


    socket.onclose =
      () => {
        console.log(
          "🔌 Viewer signaling disconnected"
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


    if (!deviceId) {
      console.error(
        "Cannot request camera: no device ID"
      );

      return;
    }


    if (!socket) {
      console.error(
        "Cannot request camera: no WebSocket"
      );

      return;
    }


    if (
      socket.readyState !==
      WebSocket.OPEN
    ) {
      console.error(
        "Cannot request camera: WebSocket not open"
      );

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
      console.log(
        "WebRTC already connected/connecting"
      );

      return;
    }


    console.log(
      "📤 VIEWER REQUESTING DEVICE:",
      deviceId
    );


    console.log(
      "Viewer ID:",
      viewerIdRef.current
    );


    socket.send(
      JSON.stringify({
        type:
          "watch_device",

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
    console.log(
      "Creating viewer RTCPeerConnection"
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


    peerConnection.ontrack =
      (event) => {
        console.log(
          "🎥 REMOTE VIDEO RECEIVED"
        );


        console.log(
          "Track:",
          event.track
        );


        const remoteStream =
          event.streams[0];


        if (
          videoRef.current &&
          remoteStream
        ) {
          videoRef.current.srcObject =
            remoteStream;


          videoRef.current
            .play()
            .catch((error) => {
              console.warn(
                "Video autoplay issue:",
                error
              );
            });
        }
      };


    peerConnection.onicecandidate =
      (event) => {
        if (!event.candidate) {
          console.log(
            "Viewer ICE gathering complete"
          );

          return;
        }


        console.log(
          "🧊 Viewer ICE candidate:",
          event.candidate.candidate
        );


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
          "🔗 VIEWER WebRTC state:",
          peerConnection.connectionState
        );


        setStatus(
          peerConnection.connectionState
        );
      };


    peerConnection.oniceconnectionstatechange =
      () => {
        console.log(
          "🧊 Viewer ICE state:",
          peerConnection.iceConnectionState
        );
      };


    peerConnection.onicegatheringstatechange =
      () => {
        console.log(
          "🧊 Viewer ICE gathering:",
          peerConnection.iceGatheringState
        );
      };


    return peerConnection;
  }


  async function handleOffer(
    offer:
      RTCSessionDescriptionInit
  ) {
    console.log(
      "Handling WebRTC offer..."
    );


    peerConnectionRef.current
      ?.close();


    pendingIceCandidatesRef.current =
      [];


    const peerConnection =
      createPeerConnection();


    peerConnectionRef.current =
      peerConnection;


    console.log(
      "Setting remote offer..."
    );


    await peerConnection
      .setRemoteDescription(
        offer
      );


    console.log(
      "✅ Remote offer accepted"
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


    console.log(
      "Creating WebRTC answer..."
    );


    const answer =
      await peerConnection
        .createAnswer();


    await peerConnection
      .setLocalDescription(
        answer
      );


    console.log(
      "📤 Sending WebRTC answer"
    );


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


    console.log(
      "✅ ANSWER SENT"
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
      !peerConnection.remoteDescription
    ) {
      console.log(
        "Queueing ICE candidate"
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
      "✅ Viewer added remote ICE candidate"
    );
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
        Viewer ID:
        {" "}
        {viewerIdRef.current}
      </p>


      <p>
        Status:
        {" "}
        {status}
      </p>


      <button
        onClick={
          requestCamera
        }
      >
        Retry Camera
      </button>


      <div>
        <video
          ref={videoRef}

          autoPlay

          playsInline

          controls

          style={{
            width: "700px",
            maxWidth: "100%",
            minHeight: "300px",
            background: "black",
          }}
        />
      </div>
    </main>
  );
}


export default DevicePage;