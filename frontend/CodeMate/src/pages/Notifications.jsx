// src/pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import { getIncomingRequests, acceptFriendRequest, rejectFriendRequest } from "../api/friends";
import { getToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const meId = localStorage.getItem("userId");
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!meId) return;
    setLoading(true);
    try {
      const res = await getIncomingRequests(meId);
      setIncoming(res.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("friends:refresh", handler);
    return () => window.removeEventListener("friends:refresh", handler);
  }, []);

  const accept = async (id) => {
    try {
      await acceptFriendRequest(id);
      await load();
    } catch (err) {
      console.error(err);
    }
  };
  const reject = async (id) => {
    try {
      await rejectFriendRequest(id);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#111] text-white">
      <DashboardNavbar />
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Notifications</h2>

        <div className="space-y-3">
          {loading ? (
            <div>Loading…</div>
          ) : incoming.length === 0 ? (
            <div className="text-gray-400">No notifications.</div>
          ) : (
            incoming.map((r) => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-zinc-900 rounded border border-white/6">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${r.sender?._id}`)}>
                  <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-sm">
                    {r.sender?.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="font-medium">{r.sender?.username} sent you a friend request</div>
                    <div className="text-xs text-gray-400">Click to view profile</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => accept(r._id)} className="px-3 py-1 rounded bg-emerald-500 text-black">Accept</button>
                  <button onClick={() => reject(r._id)} className="px-3 py-1 rounded bg-red-500 text-white">Reject</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
