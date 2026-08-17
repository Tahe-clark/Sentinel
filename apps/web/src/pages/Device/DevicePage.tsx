import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useTheme,
} from "../../contexts/ThemeContext";

import {
  createSignalingSocket,
} from "../../services/signaling";


function DevicePage() {
  const {
    deviceId,
  } = useParams();


  const navigate =
    useNavigate();


  const {
    theme,
  } = useTheme();


  const videoRef =
    useRef<HTMLVideoElement>(null);

  const videoContainerRef =
    useRef<HTMLDivElement>(null);

  const remoteStreamRef =
    useRef<MediaStream | null>(
      null
    );

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

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(
      null
    );

  const recordedChunksRef =
    useRef<Blob[]>([]);


  const [
    status,
    setStatus,
  ] = useState(
    "Connecting..."
  );

  const [
    recording,
    setRecording,
  ] = useState(false);

  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(0);

  const [
    fullscreen,
    setFullscreen,
  ] = useState(false);


  useEffect(() => {
    if (!deviceId) {
      setStatus(
        "Invalid device"
      );

      return;
    }


    const socket =
      createSignalingSocket();


    socketRef.current =
      socket;


    socket.onopen = () => {
      requestCamera();
    };


    socket.onmessage =
      async (event) => {
        const data =
          JSON.parse(
            event.data
          );


        console.log(
          "Viewer received:",
          data
        );


        if (
          data.type ===
            "camera_ready" &&
          data.device_id ===
            deviceId
        ) {
          requestCamera();

          return;
        }


        if (
          data.type ===
            "webrtc_offer" &&
          data.target_viewer_id ===
            viewerIdRef.current
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
          setStatus(
            "Camera unavailable"
          );

          return;
        }


        if (
          data.type ===
            "camera_stopped" &&
          data.device_id ===
            deviceId
        ) {
          peerConnectionRef.current
            ?.close();


          peerConnectionRef.current =
            null;


          remoteStreamRef.current =
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

          return;
        }


        if (
          data.type ===
          "authorization_error"
        ) {
          setStatus(
            data.message ??
            "Unauthorized"
          );
        }
      };


    socket.onerror = (
      error
    ) => {
      console.error(
        "Viewer WebSocket error:",
        error
      );


      setStatus(
        "Signaling error"
      );
    };


    socket.onclose = () => {
      setStatus(
        "Signaling disconnected"
      );
    };


    return () => {
      socket.close();


      peerConnectionRef.current
        ?.close();


      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          "inactive"
      ) {
        mediaRecorderRef.current
          .stop();
      }
    };
  }, [deviceId]);


  useEffect(() => {
    if (!recording) {
      setRecordingSeconds(
        0
      );

      return;
    }


    const interval =
      window.setInterval(
        () => {
          setRecordingSeconds(
            (current) =>
              current + 1
          );
        },
        1000
      );


    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [recording]);


  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(
        document.fullscreenElement ===
          videoContainerRef.current
      );
    }


    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );


    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);


  function requestCamera() {
    const socket =
      socketRef.current;


    if (
      !socket ||
      !deviceId ||
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
          deviceId,
      })
    );


    setStatus(
      "Requesting camera..."
    );
  }


  function retryCamera() {
    peerConnectionRef.current
      ?.close();


    peerConnectionRef.current =
      null;


    pendingIceCandidatesRef.current =
      [];


    remoteStreamRef.current =
      null;


    if (
      videoRef.current
    ) {
      videoRef.current.srcObject =
        null;
    }


    setStatus(
      "Requesting camera..."
    );


    requestCamera();
  }


  async function toggleFullscreen() {
    try {
      if (
        !document.fullscreenElement
      ) {
        await videoContainerRef.current
          ?.requestFullscreen();

        return;
      }


      await document
        .exitFullscreen();

    } catch (error) {
      console.error(
        "Fullscreen error:",
        error
      );
    }
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


        if (!stream) {
          return;
        }


        remoteStreamRef.current =
          stream;


        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            stream;


          videoRef.current
            .play()
            .catch(
              console.warn
            );
        }


        setStatus(
          "connected"
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
              deviceId,

            candidate:
              event.candidate
                .toJSON(),
          })
        );
      };


    peerConnection.onconnectionstatechange =
      () => {
        setStatus(
          peerConnection
            .connectionState
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
          deviceId,

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


  function startRecording() {
    const stream =
      remoteStreamRef.current;


    if (!stream) {
      return;
    }


    recordedChunksRef.current =
      [];


    const recorder =
      new MediaRecorder(
        stream
      );


    mediaRecorderRef.current =
      recorder;


    recorder.ondataavailable =
      (event) => {
        if (
          event.data.size > 0
        ) {
          recordedChunksRef.current
            .push(
              event.data
            );
        }
      };


    recorder.onstop = () => {
      const blob =
        new Blob(
          recordedChunksRef.current,
          {
            type:
              recorder.mimeType ||
              "video/webm",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const anchor =
        document.createElement(
          "a"
        );


      anchor.href =
        url;

      anchor.download =
        `sentinel-${Date.now()}.webm`;


      document.body.appendChild(
        anchor
      );


      anchor.click();


      anchor.remove();


      URL.revokeObjectURL(
        url
      );


      recordedChunksRef.current =
        [];
    };


    recorder.start();


    setRecording(
      true
    );
  }


  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;


    if (
      !recorder ||
      recorder.state ===
        "inactive"
    ) {
      return;
    }


    recorder.stop();


    setRecording(
      false
    );
  }


  function takeSnapshot() {
    const video =
      videoRef.current;


    if (
      !video ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return;
    }


    const canvas =
      document.createElement(
        "canvas"
      );


    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;


    const context =
      canvas.getContext(
        "2d"
      );


    if (!context) {
      return;
    }


    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );


    const anchor =
      document.createElement(
        "a"
      );


    anchor.href =
      canvas.toDataURL(
        "image/png"
      );


    anchor.download =
      `sentinel-snapshot-${Date.now()}.png`;


    document.body.appendChild(
      anchor
    );


    anchor.click();


    anchor.remove();
  }


  function formatTime(
    totalSeconds: number
  ) {
    const hours =
      Math.floor(
        totalSeconds / 3600
      );

    const minutes =
      Math.floor(
        (
          totalSeconds % 3600
        ) / 60
      );

    const seconds =
      totalSeconds % 60;


    return [
      hours,
      minutes,
      seconds,
    ]
      .map(
        (value) =>
          String(value)
            .padStart(
              2,
              "0"
            )
      )
      .join(":");
  }


  const connected =
    status === "connected";


  if (
    theme === "glass"
  ) {
    return (
      <div
        className="
          min-h-[70vh]
          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            w-full
            max-w-4xl
            flex
            flex-col
            overflow-hidden
            rounded-3xl
            glass-card
            text-white
          "
        >
          <div
            className="
              px-6
              py-5
              flex
              items-center
              justify-between
              border-b
              border-white/10
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <LiveDot
                active={
                  connected
                }
              />


              <div>
                <h3
                  className="
                    text-sm
                    font-bold
                    tracking-wide
                  "
                >
                  Sentinel Camera
                </h3>


                <p
                  className="
                    text-[10px]
                    opacity-70
                    font-mono
                  "
                >
                  {deviceId?.slice(
                    0,
                    8
                  )}
                  {" "}
                  //
                  {" "}
                  LIVE_FEED
                </p>
              </div>
            </div>


            <button
              type="button"

              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }

              className="
                w-8
                h-8
                rounded-full
                flex
                items-center
                justify-center
                opacity-70
                hover:opacity-100
                transition-opacity
                text-sm
                font-bold
              "
            >
              ✕
            </button>
          </div>


          <div
            ref={
              videoContainerRef
            }

            className="
              relative
              aspect-video
              bg-black
              flex
              items-center
              justify-center
              overflow-hidden
              fullscreen:bg-black
            "
          >
            <video
              ref={
                videoRef
              }

              autoPlay

              playsInline

              className="
                absolute
                inset-0
                w-full
                h-full
                object-contain
              "
            />


            <button
              type="button"

              onClick={
                toggleFullscreen
              }

              title={
                fullscreen
                  ? "Quitter le plein écran"
                  : "Plein écran"
              }

              className="
                absolute
                top-4
                right-4
                z-30
                w-9
                h-9
                flex
                items-center
                justify-center
                rounded-full
                bg-black/50
                border
                border-white/10
                text-white/70
                hover:text-white
                hover:bg-black/70
                backdrop-blur-md
                transition-all
              "
            >
              {fullscreen
                ? "×"
                : "⛶"}
            </button>


            <div
              className="
                absolute
                bottom-4
                left-4
                z-30
                flex
                items-center
                gap-2
                px-3
                py-1.5
                rounded-full
                bg-black/40
                backdrop-blur-md
                text-[10px]
                text-white/70
              "
            >
              <span
                className={
                  connected
                    ? "w-1.5 h-1.5 rounded-full bg-emerald-400"
                    : "w-1.5 h-1.5 rounded-full bg-amber-400"
                }
              />

              {status}
            </div>


            {!connected && (
              <span
                className="
                  font-mono
                  text-xs
                  text-slate-500
                  tracking-widest
                  uppercase
                  z-10
                "
              >
                {status}
              </span>
            )}
          </div>


          <div
            className="
              p-5
              flex
              flex-wrap
              items-center
              justify-between
              gap-4
              border-t
              border-white/10
              bg-white/5
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                flex-wrap
              "
            >
              <button
                type="button"

                disabled={
                  !connected
                }

                onClick={
                  recording
                    ? stopRecording
                    : startRecording
                }

                className="
                  px-4
                  py-2
                  rounded-full
                  text-xs
                  font-medium
                  bg-white/10
                  hover:bg-white/20
                  text-white
                  transition-all
                  disabled:opacity-30
                "
              >
                <span
                  className="
                    inline-block
                    w-2
                    h-2
                    rounded-full
                    bg-rose-500
                    mr-2
                  "
                />

                {recording
                  ? `Arrêter ${formatTime(recordingSeconds)}`
                  : "Enregistrer"}
              </button>


              <button
                type="button"

                disabled={
                  !connected
                }

                onClick={
                  takeSnapshot
                }

                className="
                  px-4
                  py-2
                  rounded-full
                  text-xs
                  font-medium
                  bg-white/5
                  hover:bg-white/10
                  text-muted
                  transition-all
                  disabled:opacity-30
                "
              >
                Capture Photo
              </button>
            </div>


            <ConnectionControlsGlass
              status={
                status
              }

              connected={
                connected
              }

              deviceId={
                deviceId
              }

              retryCamera={
                retryCamera
              }
            />


            <button
              type="button"

              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }

              className="
                px-5
                py-2
                rounded-full
                text-xs
                font-medium
                btn-solid
                shadow-sm
              "
            >
              Quitter
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div
      className="
        min-h-[70vh]
        flex
        items-center
        justify-center
        font-mono
      "
    >
      <div
        className="
          w-full
          max-w-4xl
          flex
          flex-col
          overflow-hidden
          rounded
          border
          border-tactical-border
          panel-tactical
          text-white
        "
      >
        <div
          className="
            px-5
            py-4
            flex
            items-center
            justify-between
            border-b
            border-tactical-border
            bg-black/40
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <LiveDot
              active={
                connected
              }
            />


            <div>
              <h3
                className="
                  text-sm
                  font-bold
                  tracking-wide
                "
              >
                Sentinel Camera
              </h3>


              <p
                className="
                  text-[10px]
                  opacity-70
                  font-mono
                "
              >
                CAM //
                {" "}
                {deviceId?.slice(
                  0,
                  8
                )}
                {" "}
                // LIVE_FEED
              </p>
            </div>
          </div>


          <button
            type="button"

            onClick={() =>
              navigate(
                "/dashboard"
              )
            }

            className="
              w-8
              h-8
              rounded-full
              flex
              items-center
              justify-center
              opacity-70
              hover:opacity-100
              transition-opacity
              text-sm
              font-bold
            "
          >
            ✕
          </button>
        </div>


        <div
          ref={
            videoContainerRef
          }

          className="
            relative
            aspect-video
            bg-black
            flex
            items-center
            justify-center
            overflow-hidden
            group
          "
        >
          <video
            ref={
              videoRef
            }

            autoPlay

            playsInline

            className="
              absolute
              inset-0
              w-full
              h-full
              object-contain
            "
          />


          <div
            className="
              absolute
              inset-4
              border
              border-emerald-500/20
              pointer-events-none
              flex
              flex-col
              justify-between
              p-3
              font-mono
              text-[10px]
              text-emerald-500/80
              z-10
            "
          >
            <div
              className="
                flex
                justify-between
                items-start
              "
            >
              <div
                className="
                  space-y-1
                "
              >
                <div>
                  CONNEXION:
                  {" "}

                  <span
                    className="
                      text-emerald-400
                    "
                  >
                    {status.toUpperCase()}
                  </span>
                </div>


                <div>
                  TRANSPORT:
                  {" "}

                  <span
                    className="
                      text-emerald-400
                    "
                  >
                    WEBRTC
                  </span>
                </div>
              </div>


              <div
                className="
                  text-right
                "
              >
                {recording && (
                  <div
                    className="
                      text-rose-500
                      font-bold
                      animate-pulse
                    "
                  >
                    ● REC
                    {" "}
                    [
                    {formatTime(
                      recordingSeconds
                    )}
                    ]
                  </div>
                )}


                <div>
                  STREAM:
                  {" "}

                  {connected
                    ? "STABLE"
                    : "WAITING"}
                </div>
              </div>
            </div>


            <div
              className="
                absolute
                top-1/2
                left-1/2
                -translate-x-1/2
                -translate-y-1/2
                w-16
                h-16
                border
                border-emerald-500/30
                rounded-full
                flex
                items-center
                justify-center
              "
            >
              <div
                className="
                  w-2
                  h-2
                  bg-emerald-500/40
                  rounded-full
                "
              />
            </div>


            <div
              className="
                flex
                justify-between
                items-end
              "
            >
              <div>
                CODEC:
                {" "}
                WebRTC
              </div>

              <div>
                DEVICE:
                {" "}
                {deviceId?.slice(
                  0,
                  8
                )}
              </div>
            </div>
          </div>


          <button
            type="button"

            onClick={
              toggleFullscreen
            }

            title={
              fullscreen
                ? "Quitter le plein écran"
                : "Plein écran"
            }

            className="
              absolute
              top-4
              right-4
              z-30
              w-9
              h-9
              flex
              items-center
              justify-center
              rounded
              bg-black/50
              border
              border-white/10
              text-white/70
              hover:text-emerald-400
              hover:border-emerald-500/40
              hover:bg-black/70
              backdrop-blur-sm
              transition-all
            "
          >
            {fullscreen
              ? "×"
              : "⛶"}
          </button>


          {!connected && (
            <span
              className="
                font-mono
                text-xs
                text-slate-500
                tracking-widest
                uppercase
                z-20
              "
            >
              {status}
            </span>
          )}
        </div>


        <div
          className="
            p-4
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
            border-t
            border-tactical-border
            bg-black/40
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              flex-wrap
            "
          >
            <button
              type="button"

              disabled={
                !connected
              }

              onClick={
                recording
                  ? stopRecording
                  : startRecording
              }

              className="
                px-3
                py-1.5
                rounded
                text-xs
                font-mono
                bg-emerald-950
                border
                border-emerald-500/40
                text-emerald-400
                hover:bg-emerald-900
                disabled:opacity-30
              "
            >
              <span
                className="
                  inline-block
                  w-2
                  h-2
                  rounded-full
                  bg-rose-500
                  mr-2
                "
              />

              {recording
                ? "Arrêter"
                : "Enregistrer"}
            </button>


            <button
              type="button"

              disabled={
                !connected
              }

              onClick={
                takeSnapshot
              }

              className="
                px-3
                py-1.5
                rounded
                text-xs
                font-mono
                bg-tactical-800
                border
                border-tactical-border
                text-slate-300
                hover:text-white
                disabled:opacity-30
              "
            >
              Capture Photo
            </button>
          </div>


          <ConnectionControlsTactical
            status={
              status
            }

            connected={
              connected
            }

            deviceId={
              deviceId
            }

            retryCamera={
              retryCamera
            }
          />


          <button
            type="button"

            onClick={() =>
              navigate(
                "/dashboard"
              )
            }

            className="
              px-4
              py-1.5
              rounded
              text-xs
              font-mono
              bg-emerald-600
              text-black
              font-bold
              uppercase
              hover:bg-emerald-500
            "
          >
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
}


function LiveDot({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className="
        relative
        flex
        h-2.5
        w-2.5
      "
    >
      {active && (
        <span
          className="
            animate-ping
            absolute
            inline-flex
            h-full
            w-full
            rounded-full
            bg-emerald-400
            opacity-75
          "
        />
      )}


      <span
        className={
          active
            ? "relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"
            : "relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-600"
        }
      />
    </span>
  );
}


function ConnectionControlsGlass({
  status,
  connected,
  deviceId,
  retryCamera,
}: {
  status: string;
  connected: boolean;
  deviceId: string | undefined;
  retryCamera: () => void;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        text-xs
        flex-wrap
        justify-center
      "
    >
      <div
        className="
          flex
          items-center
          gap-2
          px-3
          py-2
          rounded-full
          bg-white/5
          border
          border-white/10
        "
      >
        <span
          className={
            connected
              ? "w-1.5 h-1.5 rounded-full bg-emerald-400"
              : "w-1.5 h-1.5 rounded-full bg-amber-400"
          }
        />

        <span>
          {status}
        </span>
      </div>


      <span
        className="
          hidden
          sm:inline
          text-muted
          font-mono
          text-[10px]
        "
      >
        ID:
        {" "}
        {deviceId?.slice(
          0,
          8
        )}
        ...
      </span>


      <button
        type="button"

        onClick={
          retryCamera
        }

        className="
          px-4
          py-2
          rounded-full
          text-xs
          font-medium
          bg-white/5
          hover:bg-white/10
          border
          border-white/10
          transition-all
        "
      >
        Retry Camera
      </button>
    </div>
  );
}


function ConnectionControlsTactical({
  status,
  connected,
  deviceId,
  retryCamera,
}: {
  status: string;
  connected: boolean;
  deviceId: string | undefined;
  retryCamera: () => void;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        font-mono
        text-[10px]
        flex-wrap
        justify-center
      "
    >
      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <span
          className="
            text-slate-500
          "
        >
          STATUS:
        </span>


        <span
          className={
            connected
              ? "text-emerald-400"
              : "text-amber-400"
          }
        >
          {status.toUpperCase()}
        </span>
      </div>


      <span
        className="
          hidden
          md:inline
          text-slate-500
        "
      >
        |
      </span>


      <div
        className="
          hidden
          md:block
        "
      >
        <span
          className="
            text-slate-500
          "
        >
          DEVICE:
        </span>

        {" "}

        <span
          className="
            text-slate-300
          "
        >
          {deviceId?.slice(
            0,
            8
          )}
          ...
        </span>
      </div>


      <button
        type="button"

        onClick={
          retryCamera
        }

        className="
          px-3
          py-1.5
          rounded
          bg-tactical-800
          border
          border-tactical-border
          text-emerald-400
          hover:bg-emerald-950
          hover:border-emerald-500/40
          transition-colors
          uppercase
        "
      >
        Retry Camera
      </button>
    </div>
  );
}


export default DevicePage;