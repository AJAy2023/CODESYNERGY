// src/components/friends/SendRequest.jsx
import { useState } from "react";
import { sendFriendRequest } from "../../api/friends";

export default function SendRequest({ receiverId, onSent, disabled }) {
  const [loading, setLoading] = useState(false);
  const me = localStorage.getItem("userId");

  const handleClick = async () => {
    if (!me) {
      alert("Please login first");
      return;
    }
    if (!receiverId) return;

    try {
      setLoading(true);
      await sendFriendRequest(me, receiverId);
      onSent?.();
      alert("Friend request sent!");
    } catch (err) {
      alert(err?.response?.data?.msg || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`px-3 py-1 rounded-md text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-400 text-[#04121a] ${
        loading || disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      {loading ? "Sending…" : "Add Friend"}
    </button>
  );
}
