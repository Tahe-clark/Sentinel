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

import {
  createConfiguredPeerConnection,
} from "../../services/webrtc";


type SafariPresentationMode =
  | "inline"
  | "picture-in-picture"
  | "fullscreen";


type SafariVideoElement =
  HTMLVideoElement & {
    requestPictureInPicture?: () =>
      Promise<unknown>;

    webkitEnterFullscreen?: () =>
      void;

    webkitPresentationMode?:
      SafariPresentationMode;

    webkitSupportsPresentationMode?: (
      mode: SafariPresentationMode
    ) => boolean;

    webkitSetPresentationMode?: (
      mode: SafariPresentationMode
    ) => void;
  };


type PipDocument =
  Document & {
    pictureInPictureEnabled?: boolean;

    pictureInPictureElement?:
      Element | null;

    exitPictureInPicture?: () =>
      Promise<void>;
  };


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
    useRef<HTMLVideoElement>(
      null
    );

  const videoContainerRef =
    useRef<HTMLDivElement>(
      null
    );

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
    useRef<Blob[]>(
      []
    );


  const [
    status,
    setStatus,
  ] = useState(
    "Connecting..."
  );

  const [
    recording,
    setRecording,
  ] = useState(
    false
  );

  const [
    recordingSeconds,
    setRecordingSeconds,
  ] = useState(
    0
  );

  const [
    fullscreen,
    setFullscreen,
  ] = useState(
    false
  );

  const [
    pictureInPicture,
    setPictureInPicture,
  ] = useState(
    false
  );

  const [
    pipSupported,
    setPipSupported,
  ] = useState(
    true
  );


  const connected =
    status === "connected";


  useEffect(() => {
    if (!deviceId) {
      setStatus(
        "Invalid device"
      );

      return;
    }


    let disposed =
      false;

    let reconnectTimer:
      number | undefined;

    let reconnectAttempt =
      0;


    function scheduleReconnect() {
      if (disposed) {
        return;
      }


      const delay =
        Math.min(
          1000 *
            2 **
              reconnectAttempt,
          10000
        );


      reconnectAttempt +=
        1;


      setStatus(
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
        createSignalingSocket();


      socketRef.current =
        socket;


      socket.onopen =
        () => {
          reconnectAttempt =
            0;

          requestCamera();
        };


      socket.onmessage =
        async (
          event
        ) => {
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


      socket.onerror =
        (
          error
        ) => {
          console.error(
            "Viewer WebSocket error:",
            error
          );
        };


      socket.onclose =
        () => {
          if (
            socketRef.current ===
              socket
          ) {
            socketRef.current =
              null;
          }


          if (
            !disposed
          ) {
            setStatus(
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
      disposed =
        true;


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


      peerConnectionRef.current =
        null;


      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current
          .state !==
          "inactive"
      ) {
        mediaRecorderRef.current
          .stop();
      }
    };
  }, [
    deviceId,
  ]);


  useEffect(() => {
    if (
      !recording
    ) {
      setRecordingSeconds(
        0
      );

      return;
    }


    const interval =
      window.setInterval(
        () => {
          setRecordingSeconds(
            (
              current
            ) =>
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
  }, [
    recording,
  ]);


  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(
        document
          .fullscreenElement ===
          videoContainerRef
            .current
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


  useEffect(() => {
    const video =
      videoRef.current as
        SafariVideoElement |
        null;


    if (!video) {
      return;
    }


    /*
     * Important :
     * currentVideo est maintenant garanti non-null
     * dans tous les callbacks ci-dessous.
     */
    const currentVideo =
      video;


    const pipDocument =
      document as PipDocument;


    const standardPip =
      Boolean(
        pipDocument
          .pictureInPictureEnabled
      ) &&
      typeof currentVideo
        .requestPictureInPicture ===
        "function";


    const safariPip =
      typeof currentVideo
        .webkitSetPresentationMode ===
        "function" &&
      (
        typeof currentVideo
          .webkitSupportsPresentationMode !==
          "function" ||
        currentVideo
          .webkitSupportsPresentationMode(
            "picture-in-picture"
          )
      );


    setPipSupported(
      standardPip ||
        safariPip
    );


    function handleEnterPiP() {
      setPictureInPicture(
        true
      );
    }


    function handleLeavePiP() {
      setPictureInPicture(
        false
      );
    }


    function handleSafariMode() {
      setPictureInPicture(
        currentVideo
          .webkitPresentationMode ===
          "picture-in-picture"
      );


      setFullscreen(
        currentVideo
          .webkitPresentationMode ===
          "fullscreen"
      );
    }


    function handleIOSFullscreenStart() {
      setFullscreen(
        true
      );
    }


    function handleIOSFullscreenEnd() {
      setFullscreen(
        false
      );
    }


    currentVideo.addEventListener(
      "enterpictureinpicture",
      handleEnterPiP
    );


    currentVideo.addEventListener(
      "leavepictureinpicture",
      handleLeavePiP
    );


    currentVideo.addEventListener(
      "webkitpresentationmodechanged",
      handleSafariMode
    );


    currentVideo.addEventListener(
      "webkitbeginfullscreen",
      handleIOSFullscreenStart
    );


    currentVideo.addEventListener(
      "webkitendfullscreen",
      handleIOSFullscreenEnd
    );


    return () => {
      currentVideo.removeEventListener(
        "enterpictureinpicture",
        handleEnterPiP
      );


      currentVideo.removeEventListener(
        "leavepictureinpicture",
        handleLeavePiP
      );


      currentVideo.removeEventListener(
        "webkitpresentationmodechanged",
        handleSafariMode
      );


      currentVideo.removeEventListener(
        "webkitbeginfullscreen",
        handleIOSFullscreenStart
      );


      currentVideo.removeEventListener(
        "webkitendfullscreen",
        handleIOSFullscreenEnd
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
    const container =
      videoContainerRef
        .current;


    const video =
      videoRef.current as
        SafariVideoElement |
        null;


    if (!video) {
      return;
    }


    try {
      if (
        document
          .fullscreenElement
      ) {
        await document
          .exitFullscreen();

        return;
      }


      if (
        container &&
        typeof container
          .requestFullscreen ===
          "function"
      ) {
        try {
          await container
            .requestFullscreen();

          return;

        } catch {
          /*
           * Sur iPhone Safari,
           * requestFullscreen peut exister
           * sans fonctionner sur un div.
           */
        }
      }


      if (
        typeof video
          .webkitEnterFullscreen ===
          "function"
      ) {
        video
          .webkitEnterFullscreen();

        return;
      }


      if (
        typeof video
          .webkitSetPresentationMode ===
          "function" &&
        (
          typeof video
            .webkitSupportsPresentationMode !==
            "function" ||
          video
            .webkitSupportsPresentationMode(
              "fullscreen"
            )
        )
      ) {
        video
          .webkitSetPresentationMode(
            "fullscreen"
          );

        return;
      }


      console.warn(
        "Fullscreen is not supported."
      );

    } catch (
      error
    ) {
      console.error(
        "Fullscreen error:",
        error
      );
    }
  }


  async function togglePictureInPicture() {
    const video =
      videoRef.current as
        SafariVideoElement |
        null;


    if (
      !video ||
      !connected
    ) {
      return;
    }


    const pipDocument =
      document as
        PipDocument;


    try {
      if (
        pipDocument
          .pictureInPictureElement &&
        typeof pipDocument
          .exitPictureInPicture ===
          "function"
      ) {
        await pipDocument
          .exitPictureInPicture();

        return;
      }


      if (
        typeof video
          .requestPictureInPicture ===
          "function"
      ) {
        await video
          .requestPictureInPicture();

        return;
      }


      if (
        typeof video
          .webkitSetPresentationMode ===
          "function" &&
        (
          typeof video
            .webkitSupportsPresentationMode !==
            "function" ||
          video
            .webkitSupportsPresentationMode(
              "picture-in-picture"
            )
        )
      ) {
        const newMode:
          SafariPresentationMode =
            video
              .webkitPresentationMode ===
              "picture-in-picture"
              ? "inline"
              : "picture-in-picture";


        video
          .webkitSetPresentationMode(
            newMode
          );


        setPictureInPicture(
          newMode ===
            "picture-in-picture"
        );


        return;
      }


      setPipSupported(
        false
      );


      console.warn(
        "Picture-in-Picture is not supported."
      );

    } catch (
      error
    ) {
      console.error(
        "Picture-in-Picture error:",
        error
      );
    }
  }


  async function createPeerConnection() {
    const peerConnection =
      await createConfiguredPeerConnection({
        onIceCandidate:
          (
            candidate
          ) => {
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

                viewer_id:
                  viewerIdRef
                    .current,

                target_device_id:
                  deviceId,

                candidate:
                  candidate
                    .toJSON(),
              })
            );
          },


        onConnectionStateChange:
          (
            state
          ) => {
            setStatus(
              state
            );
          },


        onIceConnectionStateChange:
          (
            state
          ) => {
            console.log(
              "Viewer ICE state:",
              state
            );
          },
      });


    peerConnection.ontrack =
      (
        event
      ) => {
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
          videoRef.current
            .srcObject =
              stream;


          videoRef.current
            .play()
            .catch(
              (
                error
              ) => {
                if (
                  error.name !==
                    "AbortError"
                ) {
                  console.warn(
                    "Video play error:",
                    error
                  );
                }
              }
            );
        }


        setStatus(
          "connected"
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
      await createPeerConnection();


    peerConnectionRef.current =
      peerConnection;


    await peerConnection
      .setRemoteDescription(
        offer
      );


    for (
      const candidate
      of pendingIceCandidatesRef
        .current
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


    socketRef.current
      ?.send(
        JSON.stringify({
          type:
            "webrtc_answer",

          viewer_id:
            viewerIdRef
              .current,

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
      peerConnectionRef
        .current;


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
      remoteStreamRef
        .current;


    if (!stream) {
      return;
    }


    recordedChunksRef.current =
      [];


    try {
      const recorder =
        new MediaRecorder(
          stream
        );


      mediaRecorderRef.current =
        recorder;


      recorder.ondataavailable =
        (
          event
        ) => {
          if (
            event.data.size >
              0
          ) {
            recordedChunksRef.current
              .push(
                event.data
              );
          }
        };


      recorder.onstop =
        () => {
          const blob =
            new Blob(
              recordedChunksRef
                .current,
              {
                type:
                  recorder
                    .mimeType ||
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


          document.body
            .appendChild(
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

    } catch (
      error
    ) {
      console.error(
        "Recording error:",
        error
      );
    }
  }


  function stopRecording() {
    const recorder =
      mediaRecorderRef
        .current;


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


    document.body
      .appendChild(
        anchor
      );


    anchor.click();


    anchor.remove();
  }


  function formatTime(
    totalSeconds:
      number
  ) {
    const hours =
      Math.floor(
        totalSeconds /
          3600
      );


    const minutes =
      Math.floor(
        (
          totalSeconds %
            3600
        ) /
          60
      );


    const seconds =
      totalSeconds %
        60;


    return [
      hours,
      minutes,
      seconds,
    ]
      .map(
        (
          value
        ) =>
          String(
            value
          ).padStart(
            2,
            "0"
          )
      )
      .join(
        ":"
      );
  }


  const glass =
    theme ===
      "glass";


  return (
    <div
      className={`
        min-h-[70vh]
        flex
        items-center
        justify-center
        ${
          glass
            ? ""
            : "font-mono"
        }
      `}
    >
      <div
        className={`
          w-full
          max-w-4xl
          flex
          flex-col
          overflow-hidden
          text-white

          ${
            glass
              ? `
                rounded-3xl
                glass-card
              `
              : `
                rounded
                border
                border-tactical-border
                panel-tactical
              `
          }
        `}
      >
        <div
          className={`
            px-5
            py-4
            flex
            items-center
            justify-between
            border-b

            ${
              glass
                ? `
                  border-white/10
                `
                : `
                  border-tactical-border
                  bg-black/40
                `
            }
          `}
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

                {deviceId
                  ?.slice(
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

            onClick={
              () =>
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

            disabled={
              !connected
            }

            title="Plein écran"

            className="
              absolute
              top-4
              right-4
              z-30
              w-10
              h-10
              flex
              items-center
              justify-center
              rounded-full
              bg-black/60
              border
              border-white/10
              text-white
              backdrop-blur-md
              transition-all
              hover:bg-black/80
              disabled:opacity-30
            "
          >
            {fullscreen
              ? "×"
              : "⛶"}
          </button>


          <button
            type="button"

            onClick={
              togglePictureInPicture
            }

            disabled={
              !connected ||
              !pipSupported
            }

            title={
              pictureInPicture
                ? "Quitter Picture-in-Picture"
                : "Picture-in-Picture"
            }

            className="
              absolute
              top-4
              right-16
              z-30
              h-10
              px-3
              flex
              items-center
              justify-center
              rounded-full
              bg-black/60
              border
              border-white/10
              text-white
              text-[10px]
              font-bold
              backdrop-blur-md
              transition-all
              hover:bg-black/80
              disabled:opacity-30
            "
          >
            {pictureInPicture
              ? "PiP ×"
              : "PiP"}
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
              bg-black/50
              backdrop-blur-md
              text-[10px]
              text-white/80
            "
          >
            <span
              className={
                connected
                  ? `
                    w-2
                    h-2
                    rounded-full
                    bg-emerald-400
                  `
                  : `
                    w-2
                    h-2
                    rounded-full
                    bg-amber-400
                  `
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
                z-20
              "
            >
              {status}
            </span>
          )}
        </div>


        <div
          className={`
            p-4
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
            border-t

            ${
              glass
                ? `
                  border-white/10
                  bg-white/5
                `
                : `
                  border-tactical-border
                  bg-black/40
                `
            }
          `}
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
                text-xs
                rounded-full
                bg-white/10
                hover:bg-white/20
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
                ? `Arrêter ${formatTime(
                    recordingSeconds
                  )}`
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
                text-xs
                rounded-full
                bg-white/5
                hover:bg-white/10
                disabled:opacity-30
              "
            >
              Capture Photo
            </button>


            <button
              type="button"

              disabled={
                !connected ||
                !pipSupported
              }

              onClick={
                togglePictureInPicture
              }

              className="
                px-4
                py-2
                text-xs
                rounded-full
                bg-white/5
                hover:bg-white/10
                disabled:opacity-30
              "
            >
              {pictureInPicture
                ? "Quitter PiP"
                : "Fenêtre flottante"}
            </button>
          </div>


          <div
            className="
              flex
              items-center
              gap-3
              flex-wrap
              text-xs
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
                className={
                  connected
                    ? `
                      w-2
                      h-2
                      rounded-full
                      bg-emerald-400
                    `
                    : `
                      w-2
                      h-2
                      rounded-full
                      bg-amber-400
                    `
                }
              />


              <span>
                {status}
              </span>
            </div>


            <button
              type="button"

              onClick={
                retryCamera
              }

              className="
                px-4
                py-2
                text-xs
                rounded-full
                bg-white/5
                hover:bg-white/10
                border
                border-white/10
              "
            >
              Retry Camera
            </button>
          </div>


          <button
            type="button"

            onClick={
              () =>
                navigate(
                  "/dashboard"
                )
            }

            className="
              px-5
              py-2
              text-xs
              font-medium
              rounded-full
              btn-solid
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
  active:
    boolean;
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
            ? `
              relative
              inline-flex
              rounded-full
              h-2.5
              w-2.5
              bg-emerald-500
            `
            : `
              relative
              inline-flex
              rounded-full
              h-2.5
              w-2.5
              bg-slate-600
            `
        }
      />
    </span>
  );
}


export default DevicePage;