import { useEffect, useState, useCallback } from "react";
import { getFriendList } from "../../api/friends";
import { useAuth } from "@/context/AuthContext";
import FriendCard from "./FriendCard";

import socket from "../../Collab/socket";

export default function FriendList() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const userId = user?.id || user?._id || localStorage.getItem("userId");

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await getFriendList(userId);
      setFriends(res?.data?.friends || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener("friends:refresh", onRefresh);
    socket.on("friends:refresh", onRefresh);

    return () => {
      window.removeEventListener("friends:refresh", onRefresh);
      socket.off("friends:refresh", onRefresh);
    };
  }, [load]);

  if (!userId) {
    return (
      <div className="text-slate-300 text-sm">
        Please login to see your friends.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-white/10 bg-zinc-900 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!friends.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 text-slate-300">
        You don’t have any friends yet. Use the <span className="text-emerald-300 font-medium">Search</span> tab to find people.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {friends.map((f) => (
        <FriendCard key={f._id} friend={f} />
      ))}
    </div>
  );
}
