// src/components/Room/CreateRoomPopup.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../api/config";

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

  useEffect(() => {
    setRoomName(localStorage.getItem("roomName") || "");
    setRoomId(localStorage.getItem("roomId") || "");
    setRoomType(localStorage.getItem("roomType") || "Battle");
    setMembersCount(localStorage.getItem("membersCount") || "2");
    setVideo(localStorage.getItem("video") === "true");
    setAudio(localStorage.getItem("audio") === "true");

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

    const payload = {
      userId,
      roomname: roomName,
      roomId,
      problem: selectedProblem._id || selectedProblem.id || "",
      roomType: roomType.toLowerCase(),
      peoplecount: parseInt(membersCount),
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
          membersCount,
          video,
          audio,
        };

        localStorage.setItem("createdRoomData", JSON.stringify(createdRoom));

        // ✅ Clear old form data
        [
          "roomName",
          "roomId",
          "roomType",
          "membersCount",
          "video",
          "audio",
          "selectedProblem",
        ].forEach((key) => localStorage.removeItem(key));

<<<<<<< Updated upstream
        //  Navigate to waiting room with roomId
        navigate(`/waitingroom/${res.data.room.roomId}`);

        //  Optional: Close modal after navigation
=======
        navigate(`/waitingroom/${res.data.room.roomId}`);

>>>>>>> Stashed changes
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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80">
      <div className="bg-zinc-900 text-white p-6 rounded shadow-md w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-white text-xl">
          ✖
        </button>
        <h2 className="text-xl font-bold mb-4 text-center text-teal-300">🚀 Create Room</h2>

        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => {
            setRoomName(e.target.value);
            localStorage.setItem("roomName", e.target.value);
          }}
          className="w-full p-2 mb-3 rounded bg-zinc-800 border border-zinc-600"
        />

        <input
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            localStorage.setItem("roomId", e.target.value);
          }}
          className="w-full p-2 mb-3 rounded bg-zinc-800 border border-zinc-600"
        />

        <div
          onClick={goToProblemSelection}
          className="cursor-pointer w-full p-2 mb-3 rounded bg-zinc-700 hover:bg-zinc-600 border border-zinc-500 text-left"
        >
<<<<<<< Updated upstream
           Problem: {selectedProblem ? selectedProblem.title : "Select Problem"}
=======
          Problem: {selectedProblem ? selectedProblem.title : "Select Problem"}
>>>>>>> Stashed changes
        </div>

        <select
          value={roomType}
          onChange={(e) => {
            setRoomType(e.target.value);
            localStorage.setItem("roomType", e.target.value);
          }}
          className="w-full p-2 mb-3 rounded bg-zinc-800 border border-zinc-600"
        >
          <option value="Battle">Battle</option>
          <option value="Discussion">Discussion</option>
        </select>

        <select
          value={membersCount}
          onChange={(e) => {
            setMembersCount(e.target.value);
            localStorage.setItem("membersCount", e.target.value);
          }}
          className="w-full p-2 mb-3 rounded bg-zinc-800 border border-zinc-600"
        >
          <option value="2">2 People</option>
          <option value="3">3 People</option>
          <option value="4">4 People</option>
        </select>

        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={video}
              onChange={(e) => {
                setVideo(e.target.checked);
                localStorage.setItem("video", e.target.checked);
              }}
            />
            🎥 Video ON
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={audio}
              onChange={(e) => {
                setAudio(e.target.checked);
                localStorage.setItem("audio", e.target.checked);
              }}
            />
            🎙 Audio ON
          </label>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 rounded disabled:opacity-50"
        >
<<<<<<< Updated upstream
          Create Room
=======
          {loading ? "Creating..." : "Create Room"}
>>>>>>> Stashed changes
        </button>
      </div>
    </div>
  );
};

export default CreateRoomPopup;
