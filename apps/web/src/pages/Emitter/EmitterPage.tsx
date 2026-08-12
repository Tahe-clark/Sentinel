import { useRef, useState } from "react";

function EmitterPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [stream, setStream] =
    useState<MediaStream | null>(null);

  async function startCamera() {
    try {
      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera error:", error);
    }
  }

  function stopCamera() {
    if (!stream) {
      return;
    }

    stream.getTracks().forEach((track) => {
      track.stop();
    });

    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  return (
    <main>
      <h1>Emitter</h1>

      <p>
        Share this device's camera with Sentinel.
      </p>

      <button onClick={startCamera}>
        Start Camera
      </button>

      <button onClick={stopCamera}>
        Stop Camera
      </button>

      <div>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
      </div>
    </main>
  );
}

export default EmitterPage;