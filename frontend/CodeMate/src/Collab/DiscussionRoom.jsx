import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "./socket";
import Whiteboard from "../components/Whiteboard";
import { v4 as uuidv4 } from "uuid";

const DiscussionRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const localVideoRef = useRef();
  const peerConnections = useRef({});

  useEffect(() => {
    if (!userId || !roomId) return;

    // 1. Join the room
    socket.emit("join-room", { roomId, userId });

    // 2. Access camera/mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.on("user-joined", ({ userId: newUserId }) => {
          const peer = createPeer(newUserId, stream);
          peerConnections.current[newUserId] = peer;
        });

        socket.on("offer", async ({ from, offer }) => {
          const peer = new RTCPeerConnection();
          peerConnections.current[from] = peer;

          stream.getTracks().forEach((track) => peer.addTrack(track, stream));

          peer.ontrack = ({ streams: [remoteStream] }) => {
            addRemoteVideo(from, remoteStream);
          };

          await peer.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socket.emit("answer", {
            to: from,
            answer,
            roomId,
          });
        });

        socket.on("answer", ({ from, answer }) => {
          const peer = peerConnections.current[from];
          if (peer) {
            peer.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socket.on("ice-candidate", ({ from, candidate }) => {
          const peer = peerConnections.current[from];
          if (peer) {
            peer.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        socket.on("user-left", ({ userId: leftUser }) => {
          const video = document.getElementById(`video-${leftUser}`);
          if (video) video.remove();

          if (peerConnections.current[leftUser]) {
            peerConnections.current[leftUser].close();
            delete peerConnections.current[leftUser];
          }
        });
      });

    return () => {
      socket.emit("leave-room", { roomId, userId });
      Object.values(peerConnections.current).forEach((peer) => peer.close());
    };
  }, [roomId]);

  const createPeer = (newUserId, stream) => {
    const peer = new RTCPeerConnection();

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to: newUserId,
          candidate: e.candidate,
          roomId,
        });
      }
    };

    peer.ontrack = ({ streams: [remoteStream] }) => {
      addRemoteVideo(newUserId, remoteStream);
    };

    peer
      .createOffer()
      .then((offer) => {
        peer.setLocalDescription(offer);
        socket.emit("offer", {
          to: newUserId,
          offer,
          roomId,
        });
      });

    return peer;
  };

  const addRemoteVideo = (userId, stream) => {
    const video = document.createElement("video");
    video.id = `video-${userId}`;
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.className =
      "w-64 h-48 object-cover rounded shadow border border-gray-400";
    const grid = document.getElementById("video-grid");
    grid.appendChild(video);
  };

  const toggleMic = () => {
    localStream.getAudioTracks()[0].enabled = !micOn;
    setMicOn((prev) => !prev);
  };

  const toggleVideo = () => {
    localStream.getVideoTracks()[0].enabled = !videoOn;
    setVideoOn((prev) => !prev);
  };

  return (
    <div className="bg-zinc-900 text-white min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Discussion Room: {roomId}</h2>
        <div className="flex gap-4">
          <button
            onClick={toggleMic}
            className={`px-3 py-1 rounded ${
              micOn ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {micOn ? "Mic On" : "Mic Off"}
          </button>
          <button
            onClick={toggleVideo}
            className={`px-3 py-1 rounded ${
              videoOn ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {videoOn ? "Video On" : "Video Off"}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div
        id="video-grid"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6"
      >
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-64 h-48 object-cover rounded border-2 border-blue-400 shadow"
        />
      </div>

      {/* Whiteboard */}
      <Whiteboard roomId={roomId} />

      {/* Optional chat or screen share panel here */}
      {/* <ChatPanel roomId={roomId} /> */}
    </div>
  );
};

export default DiscussionRoom;
