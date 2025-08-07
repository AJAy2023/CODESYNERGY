// src/pages/CodingRooms.jsx
import { useEffect, useState } from "react";
import CreateRoomPopup from "../components/Room/CreateRoomPopup";
import RoomWaitingLobby from "../components/Room/RoomWaitingLobby";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../api/config";

const CodingRooms = () => {
  const [createdRoom, setCreatedRoom] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));

    const room = localStorage.getItem("createdRoomData");
    if (room) {
      const parsed = JSON.parse(room);
      setCreatedRoom(parsed);
      localStorage.removeItem("createdRoomData");
    } else {
      fetchCreatedRoomFromBackend();
    }

    if (window.location.pathname === "/rooms/createroom") {
      setShowPopup(true);
    }
  }, []);

  const fetchCreatedRoomFromBackend = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/rooms/active-rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.myRooms.length > 0) {
        setCreatedRoom(res.data.myRooms[0]); // only one room allowed
      }
    } catch (err) {
      console.error("Failed to load created room", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-teal-400"> Your Active Coding Room</h1>
        <button
          onClick={() => setShowPopup(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-md"
        >
           Create Room
        </button>
      </div>

      {createdRoom ? (
        <RoomWaitingLobby roomData={createdRoom} currentUser={userId} />
      ) : (
        <div className="text-center text-zinc-400 mt-20 text-lg">
          You don't have any active room.
        </div>
      )}

      {showPopup && <CreateRoomPopup onClose={() => setShowPopup(false)} />}
    </div>
  );
};

export default CodingRooms;
