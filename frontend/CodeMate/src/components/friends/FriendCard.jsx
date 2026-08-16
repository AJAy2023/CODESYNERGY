import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { unfriend } from "../../api/friends";

export default function FriendCard({ friend }) {
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(false);

  if (!friend) return null;

  const handleUnfriend = async (e) => {
    e.stopPropagation();
    if (removing) return;
    try {
      setRemoving(true);
      const me = localStorage.getItem("userId");
      await unfriend(me, friend._id);
      window.dispatchEvent(new CustomEvent("friends:refresh")); 
    } catch (err) {
      alert(err?.response?.data?.msg || "Failed to remove friend");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/profile/${friend._id}`)}
      className="group cursor-pointer rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 hover:from-zinc-800/70 hover:to-zinc-900/70 transition p-4 flex items-center gap-4"
    >
      <img
        src={friend.profilePic || "https://i.pravatar.cc/100?img=12"}
        alt={friend.username}
        className="h-12 w-12 rounded-full ring-2 ring-white/10 object-cover"
      />
      <div className="flex-1">
        <div className="font-semibold text-slate-100">{friend.username}</div>
        <div className="text-xs text-slate-400">Tap to view profile</div>
      </div>

      <button
        onClick={handleUnfriend}
        disabled={removing}
        className={`px-3 py-1 rounded-md text-sm border border-white/10 hover:border-red-400/40 hover:text-red-300 transition ${
          removing ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {removing ? "Removing..." : "Unfriend"}
      </button>
    </div>
  );
}
