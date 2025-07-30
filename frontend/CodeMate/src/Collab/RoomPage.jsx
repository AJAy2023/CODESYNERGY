import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import  socket  from "./socket";
import { Mic, MicOff, Video, VideoOff, ScreenShare } from "lucide-react";
import Editor from "@monaco-editor/react";

const RoomPage = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [codeUser1, setCodeUser1] = useState("// Your Code Here");
  const [codeUser2, setCodeUser2] = useState("// Opponent's Code");

  const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    socket.emit("join-room", { roomId, userId });

    socket.on("room-error", (data) => alert(data.msg));

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    socket.on("room-started", () => startCall(userId));

    socket.on("webrtc-offer", async ({ sdp, from }) => {
      peerConnectionRef.current = new RTCPeerConnection(config);
      addTracks();

      peerConnectionRef.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socket.emit("webrtc-answer", {
        sdp: answer,
        to: from,
        roomId,
      });
    });

    socket.on("webrtc-answer", async ({ sdp }) => {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("webrtc-ice", async ({ candidate }) => {
      if (candidate && peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error("ICE candidate error", e);
        }
      }
    });

    return () => {
      socket.emit("leave-room", { roomId, userId });
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [roomId]);

  const addTracks = () => {
    localStreamRef.current.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, localStreamRef.current);
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice", {
          candidate: event.candidate,
          roomId,
        });
      }
    };
  };

  const startCall = async (userId) => {
    peerConnectionRef.current = new RTCPeerConnection(config);
    addTracks();

    peerConnectionRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    socket.emit("webrtc-offer", {
      sdp: offer,
      roomId,
      from: userId,
    });
  };

  const toggleMic = () => {
    const audioTrack = localStreamRef.current
      ?.getAudioTracks()
      .find((track) => track.kind === "audio");
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    const videoTrack = localStreamRef.current
      ?.getVideoTracks()
      .find((track) => track.kind === "video");
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  };

  const handleScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
      if (sender) sender.replaceTrack(screenTrack);
      screenTrack.onended = () => {
        // Revert to camera
        const originalTrack = localStreamRef.current.getVideoTracks()[0];
        if (sender) sender.replaceTrack(originalTrack);
      };
    } catch (err) {
      console.error("Screen share error", err);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen p-4 flex flex-col gap-4">
      {/* Video Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-800 p-3 rounded-lg">
          <p className="text-center">You</p>
          <video ref={localVideoRef} autoPlay muted className="w-full h-64 bg-black rounded-lg" />
        </div>
        <div className="bg-zinc-800 p-3 rounded-lg">
          <p className="text-center">Opponent</p>
          <video ref={remoteVideoRef} autoPlay className="w-full h-64 bg-black rounded-lg" />
        </div>
      </div>

      {/* Control Section */}
      <div className="flex justify-center gap-6">
        <button onClick={toggleMic} className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600">
          {micOn ? <Mic /> : <MicOff />}
        </button>
        <button onClick={toggleCam} className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600">
          {camOn ? <Video /> : <VideoOff />}
        </button>
        <button onClick={handleScreenShare} className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500">
          <ScreenShare />
        </button>
      </div>

      {/* Code Editor Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-2 rounded-lg">
          <h3 className="text-sm text-cyan-300">Your Editor</h3>
          <Editor
            height="300px"
            language="javascript"
            theme="vs-dark"
            value={codeUser1}
            onChange={(val) => setCodeUser1(val)}
          />
        </div>
        <div className="bg-zinc-900 p-2 rounded-lg">
          <h3 className="text-sm text-fuchsia-300">Opponent Editor</h3>
          <Editor
            height="300px"
            language="javascript"
            theme="vs-dark"
            value={codeUser2}
            options={{ readOnly: true }}
          />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
