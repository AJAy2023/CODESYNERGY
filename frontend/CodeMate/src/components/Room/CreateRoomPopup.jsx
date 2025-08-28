// src/components/Room/CreateRoomPopup.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../api/config";
import socket from "../../Collab/socket";
import { motion } from "framer-motion";
import { ArrowLeft, X, Link2, Loader2, Video, Mic } from "lucide-react";

const GUARDIAN = "#0AA1C0";
const MAX_DISCUSSION = 4;
const MIN_DISCUSSION = 2;

const CreateRoomPopup = ({ onClose }) => {
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [roomType, setRoomType] = useState("Battle");
  const [membersCount, setMembersCount] = useState("2");
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [loading, setLoading] = useState(false);

  const isDiscussion = useMemo(
    () => String(roomType).toLowerCase() === "discussion",
    [roomType]
  );

  useEffect(() => {
    setRoomName(localStorage.getItem("roomName") || "");
    setRoomId(localStorage.getItem("roomId") || "");
    setRoomType(localStorage.getItem("roomType") || "Battle");
    setMembersCount(localStorage.getItem("membersCount") || "2");
    setVideo(localStorage.getItem("video") === "true" || true);
    setAudio(localStorage.getItem("audio") === "true" || true);

    const storedProblem = localStorage.getItem("selectedProblem");
    if (storedProblem) {
      try {
        const parsed = JSON.parse(storedProblem);
        setSelectedProblem(parsed);
      } catch {
        setSelectedProblem({ title: storedProblem });
      }
    }

    // Auto-focus first input
    setTimeout(() => {
      document.querySelector("input[placeholder='Room Name']")?.focus();
    }, 0);
  }, []);

  const handleCreate = async () => {
    if (loading) return;

    if (!roomName || !roomId || !selectedProblem || !roomType || !membersCount) {
      alert("Please fill in all fields!");
      return;
    }

    if (!/^[a-zA-Z0-9_-]{3,}$/.test(roomId)) {
      alert("Room ID must be at least 3 characters and contain only letters, numbers, hyphens, or underscores.");
      return;
    }

    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) {
      alert("User not authenticated. Please login again.");
      return;
    }

    // ----- front-end validation aligned with backend rules -----
    let finalPeopleCount = parseInt(membersCount, 10);
    const lowerType = String(roomType).toLowerCase();

    if (lowerType === "battle") {
      // Battle must be exactly 2
      finalPeopleCount = 2;
    } else {
      // Discussion must be within [2..10]
      if (Number.isNaN(finalPeopleCount) || finalPeopleCount < MIN_DISCUSSION || finalPeopleCount > MAX_DISCUSSION) {
        alert(`Discussion room must have between ${MIN_DISCUSSION} and ${MAX_DISCUSSION} participants (including host).`);
        return;
      }
    }

    const payload = {
      userId,
      roomname: roomName,
      roomId,
      problem: selectedProblem._id || selectedProblem.id || "",
      roomType: lowerType,
      peoplecount: finalPeopleCount,
      videoEnabled: Boolean(video),
      audioEnabled: Boolean(audio),
    };

    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/rooms/createroom`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 201) {
        const createdRoom = {
          roomName,
          roomId,
          selectedProblem,
          roomType,
          membersCount: String(finalPeopleCount),
          video,
          audio,
        };

        localStorage.setItem("createdRoomData", JSON.stringify(createdRoom));

        [
          "roomName",
          "roomId",
          "roomType",
          "membersCount",
          "video",
          "audio",
          "selectedProblem",
        ].forEach((key) => localStorage.removeItem(key));

        
        socket.emit("join-room", {
          roomId,
          userId,
        });

        //  route based on room type
        if (lowerType === "discussion") {
          navigate(`/discussion/${roomId}`);
        } else {
          navigate(`/waitingroom/${roomId}`);
        }

        if (typeof onClose === "function") {
          onClose();
        }
      }
    } catch (err) {
      console.error("Room creation failed:", err);
      alert(
        err.response?.data?.msg ||
          "Room creation failed. Please check room ID and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const goToProblemSelection = () => {
    navigate("/problems", { state: { fromCreateRoom: true } });
  };

  // Build members options:
  // - Battle: fixed 2
  // - Discussion: 2..10
  const memberOptions = useMemo(() => {
    if (!isDiscussion) return [2];
    const arr = [];
    for (let i = MIN_DISCUSSION; i <= MAX_DISCUSSION; i++) arr.push(i);
    return arr;
  }, [isDiscussion]);

  // When switching type to Battle, force UI to 2 to avoid confusion.
  const handleTypeChange = (e) => {
    const val = e.target.value;
    setRoomType(val);
    localStorage.setItem("roomType", val);
    if (String(val).toLowerCase() === "battle") {
      setMembersCount("2");
      localStorage.setItem("membersCount", "2");
    } else if (parseInt(membersCount, 10) > MAX_DISCUSSION) {
      setMembersCount(String(MAX_DISCUSSION));
      localStorage.setItem("membersCount", String(MAX_DISCUSSION));
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Dim + subtle gradient glow background */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: GUARDIAN }} />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: "#10B981" }} />
      </div>

      {/* Centered modal */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <motion.div
          key="create-room-modal"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg"
        >
          {/* Card */}
          <div
            className="
              relative overflow-hidden rounded-2xl shadow-2xl
              bg-zinc-950/70 backdrop-blur-xl
              border border-white/10
            "
          >
            {/* hover/active halo */}
            <div className="pointer-events-none absolute -inset-1 opacity-0 md:group-hover:opacity-100">
              <div className="absolute -inset-24 blur-3xl opacity-10 bg-[conic-gradient(at_20%_20%,#10B981_0deg,#06b6d4_120deg,#10B981_240deg,#06b6d4_360deg)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5">
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 text-slate-200/90 hover:text-white transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">Back</span>
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-center text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                   Create Room
                </span>
              </h2>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-200" />
              </button>
            </div>

            <div className="px-5 sm:px-6 pb-6 pt-3">
              {/* Room Name */}
              <div className="mb-3.5">
                <input
                  type="text"
                  placeholder="Room Name"
                  value={roomName}
                  onChange={(e) => {
                    setRoomName(e.target.value);
                    localStorage.setItem("roomName", e.target.value);
                  }}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-zinc-900/70 border border-cyan-600/30
                    placeholder-white/40 text-white
                    focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/50
                    transition
                  "
                />
              </div>

              {/* Room ID */}
              <div className="mb-3.5">
                <input
                  type="text"
                  placeholder="Room ID"
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    localStorage.setItem("roomId", e.target.value);
                  }}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-zinc-900/70 border border-cyan-600/30
                    placeholder-white/40 text-white
                    focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/50
                    transition
                  "
                />
              </div>

              {/* Problem select (styled button-like) */}
              <div
                onClick={goToProblemSelection}
                className="
                  cursor-pointer w-full px-4 py-3 mb-3.5 rounded-xl
                  bg-zinc-800/70 hover:bg-zinc-800
                  border border-cyan-600/30
                  text-left text-white transition
                "
              >
                {/* visible */}
                Problem: {selectedProblem ? selectedProblem.title : "Select Problem"}
                {/* preserved duplicate (visually hidden to keep your code unchanged) */}
                <span className="sr-only">
                  Problem: {selectedProblem ? selectedProblem.title : "Select Problem"}
                </span>
              </div>

              {/* Room Type */}
              <div className="mb-3.5">
                <select
                  value={roomType}
                  onChange={handleTypeChange}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-zinc-900/70 border border-cyan-600/30
                    text-white
                    focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/50
                    transition
                  "
                >
                  <option value="Battle">Battle</option>
                  <option value="Discussion">Discussion</option>
                </select>
              </div>

              {/* Members Count */}
              <div className="mb-4">
                <select
                  value={membersCount}
                  onChange={(e) => {
                    setMembersCount(e.target.value);
                    localStorage.setItem("membersCount", e.target.value);
                  }}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-zinc-900/70 border border-cyan-600/30
                    text-white
                    focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/50
                    transition
                  "
                >
                  {memberOptions.map((n) => (
                    <option key={n} value={String(n)}>
                      {n} {n === 1 ? "Person" : "People"}
                    </option>
                  ))}
                </select>
                {!isDiscussion && (
                  <p className="text-xs text-slate-400 mt-1">
                    Battle rooms are always 2 participants.
                  </p>
                )}
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between mb-5">
                <label className="flex items-center gap-2 text-slate-200">
                  <input
                    type="checkbox"
                    checked={video}
                    onChange={(e) => {
                      setVideo(e.target.checked);
                      localStorage.setItem("video", e.target.checked);
                    }}
                    className="accent-cyan-400 w-4 h-4"
                  />
                  <Video className="w-4 h-4 text-cyan-300" />
                  <span>Video ON</span>
                </label>
                <label className="flex items-center gap-2 text-slate-200">
                  <input
                    type="checkbox"
                    checked={audio}
                    onChange={(e) => {
                      setAudio(e.target.checked);
                      localStorage.setItem("audio", e.target.checked);
                    }}
                    className="accent-emerald-400 w-4 h-4"
                  />
                  <Mic className="w-4 h-4 text-emerald-300" />
                  <span>Audio ON</span>
                </label>
              </div>

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={loading}
                className={`
                  group w-full py-3.5 rounded-xl font-semibold text-black
                  transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed
                `}
                style={{
                  background: "linear-gradient(90deg, #10B981 0%, #22D3EE 100%)",
                  boxShadow: "0 10px 30px rgba(34, 211, 238, 0.25)",
                  border: `1px solid rgba(34, 211, 238, 0.35)`,
                }}
              >
                <span className="inline-flex items-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-5 h-5" />
                      Create Room
                    </>
                  )}
                </span>
              </button>

              {/* Helper text */}
              <p className="text-center text-sm text-slate-400 mt-3">
                Your room will open in a {isDiscussion ? "discussion room" : "waiting lobby"}. Share the{" "}
                <span className="text-cyan-300">Room ID</span> with friends to join.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateRoomPopup;
