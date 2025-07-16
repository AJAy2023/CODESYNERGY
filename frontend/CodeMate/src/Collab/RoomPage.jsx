import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import CodeEditor from "../components/Editor";
import VideoGrid from "../components/VideoGrid";
import {
  VideoIcon,
  VideoOffIcon,
  MicIcon,
  MicOffIcon,
  MessageSquare,
  ArrowLeftIcon,
  LockIcon,
  UnlockIcon,
  X,
  TerminalSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";

const socket = io(import.meta.env.VITE_SOCKET_URL);

const RoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || "Guest";

  const [code, setCode] = useState("// Start coding...");
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState("description");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    socket.emit("join-room", { roomId, username });

    socket.on("user-joined", ({ clients }) => {
      setClients(clients);
      toast.success("A user joined the room");
    });

    socket.on("receive-code", ({ code }) => {
      setCode(code);
    });

    socket.on("receive-message", ({ username, message }) => {
      setMessages((prev) => [...prev, { username, message }]);
    });

    socket.on("user-disconnected", ({ socketId }) => {
      setClients((prev) => prev.filter((client) => client.socketId !== socketId));
    });

    socket.on("battle-problem", (data) => {
      setProblem(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  // 🔥 Battle: First FREE Problem
  const fetchAndStartBattle = async () => {
    try {
      const res = await fetch("https://codemate-1-nuih.onrender.com/problems");
      const data = await res.json();
      const firstFreeProblem = data.slice(0, 5)[0];
      setProblem(firstFreeProblem);
      socket.emit("battle-problem", firstFreeProblem);
      toast.success("🚀 Battle Started!");
    } catch (err) {
      toast.error("Failed to fetch problem");
    }
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("send-code", { roomId, code: newCode });
  };

  const handleSendMessage = () => {
    if (inputMsg.trim()) {
      socket.emit("send-message", { roomId, username, message: inputMsg });
      setMessages((prev) => [...prev, { username, message: inputMsg }]);
      setInputMsg("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage();
  };

  // 🎥 Video Call Setup
  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;

      setParticipants([
        { username, videoRef: localVideoRef, micOn, videoOn, isLocal: true },
      ]);

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { candidate: event.candidate, roomId });
        }
      };

      peerConnection.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
        setParticipants((prev) => [
          ...prev,
          {
            username: "Peer",
            videoRef: remoteVideoRef,
            micOn: true,
            videoOn: true,
            isLocal: false,
          },
        ]);
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("video-offer", { offer, roomId });
    } catch (error) {
      console.error("Video call error:", error);
    }
  };

  socket.on("video-offer", async ({ offer }) => {
    const peerConnection = new RTCPeerConnection();
    peerConnectionRef.current = peerConnection;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;

    setParticipants([
      { username, videoRef: localVideoRef, micOn, videoOn, isLocal: true },
    ]);

    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, roomId });
      }
    };

    peerConnection.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
      setParticipants((prev) => [
        ...prev,
        {
          username: "Peer",
          videoRef: remoteVideoRef,
          micOn: true,
          videoOn: true,
          isLocal: false,
        },
      ]);
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("video-answer", { answer, roomId });
  });

  socket.on("video-answer", async ({ answer }) => {
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  });

  socket.on("ice-candidate", async ({ candidate }) => {
    if (candidate && peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("ICE error:", err);
      }
    }
  });

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks()[0].enabled = !videoOn;
      setVideoOn(!videoOn);
    }
  };

  return (
    <div className="flex h-screen text-white bg-gradient-to-br from-black via-gray-900 to-zinc-900">
      <div className="flex flex-col flex-grow p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <ArrowLeftIcon onClick={() => navigate("/dashboard")} className="cursor-pointer" />
            <h2 className="text-xl font-bold text-cyan-400">Room ID: {roomId}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleMic} className="bg-yellow-600 px-3 py-2 rounded">
              {micOn ? <MicIcon size={18} /> : <MicOffIcon size={18} />}
            </button>
            <button onClick={toggleVideo} className="bg-blue-600 px-3 py-2 rounded">
              {videoOn ? <VideoIcon size={18} /> : <VideoOffIcon size={18} />}
            </button>
            <button onClick={() => setChatOpen((prev) => !prev)} className="bg-pink-600 px-3 py-2 rounded">
              <MessageSquare size={18} />
            </button>
            <button onClick={fetchAndStartBattle} className="bg-green-600 px-3 py-2 rounded flex items-center gap-1">
              <TerminalSquare size={18} /> Battle
            </button>
            <button onClick={() => navigate("/dashboard")} className="bg-red-600 px-3 py-2 rounded flex items-center gap-1">
              <X size={18} /> Exit
            </button>
          </div>
        </div>

        {/* Video Section */}
        <div className="mb-4">
          <VideoGrid participants={participants} localRef={localVideoRef} remoteRef={remoteVideoRef} />
        </div>

        {/* Problem Tabs */}
        {problem && (
          <div className="bg-zinc-800 p-4 rounded mb-4">
            <div className="flex gap-4 border-b border-zinc-600 mb-2">
              {["description", "testcases"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`capitalize px-3 py-1 rounded ${
                    activeTab === tab
                      ? "bg-zinc-700 text-yellow-400"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {activeTab === "description" && (
              <div>
                <h3 className="text-xl font-bold text-cyan-400">{problem?.title}</h3>
                <p className="text-sm mt-2">{problem?.statement}</p>
              </div>
            )}
            {activeTab === "testcases" && (
              <pre className="text-sm whitespace-pre-wrap">
                <strong>Input:</strong> {problem?.input}{"\n"}
                <strong>Output:</strong> {problem?.output}
              </pre>
            )}
          </div>
        )}

        {/* Code Editor */}
        <div className="flex-grow">
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            socket={socket}
            roomId={roomId}
            username={username}
          />
        </div>
      </div>

      {/* Chat Sidebar */}
      {chatOpen && (
        <div className="w-1/4 bg-zinc-800 p-4 flex flex-col border-l border-zinc-600">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">Chat</h3>
          <div className="flex-grow overflow-y-auto space-y-2 scrollbar-thin pr-2">
            {messages.map((msg, idx) => (
              <div key={idx} className="bg-zinc-700 p-2 rounded text-sm">
                <strong className="text-blue-300">{msg.username}:</strong> {msg.message}
              </div>
            ))}
          </div>
          <div className="flex mt-3 gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type message..."
              className="flex-grow px-3 py-2 bg-zinc-700 rounded border border-zinc-600 text-white"
            />
            <button onClick={handleSendMessage} className="bg-blue-600 px-4 rounded text-white">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
