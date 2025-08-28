// src/components/friends/FriendRequests.jsx
import React, { useEffect, useState } from "react";
import {
  getIncomingRequests,
  getOutgoingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelOutgoingRequest,
} from "../../api/friends";
import { useNavigate } from "react-router-dom";

export default function FriendRequests() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const me = localStorage.getItem("userId");
  const navigate = useNavigate();

  const load = async () => {
    if (!me) return;
    try {
      setLoading(true);
      const [inc, out] = await Promise.allSettled([
        getIncomingRequests(me),
        getOutgoingRequests(me),
      ]);
      if (inc.status === "fulfilled") {
        setIncoming(inc.value?.data?.requests || []);
      } else {
        setIncoming(undefined);
      }
      if (out.status === "fulfilled") {
        setOutgoing(out.value?.data?.requests || []);
      } else {
        setOutgoing(undefined);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // optional: listen to global refresh events if other parts of app update friend requests
    const handler = () => load();
    window.addEventListener("friends:refresh", handler);
    return () => window.removeEventListener("friends:refresh", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accept = async (reqId) => {
    try {
      await acceptFriendRequest(reqId);
      await load();
      window.dispatchEvent(new CustomEvent("friends:refresh"));
    } catch (err) {
      alert(err?.response?.data?.msg || "Failed to accept");
    }
  };
  const reject = async (reqId) => {
    try {
      await rejectFriendRequest(reqId);
      await load();
    } catch (err) {
      alert(err?.response?.data?.msg || "Failed to reject");
    }
  };
  const cancel = async (reqId) => {
    try {
      await cancelOutgoingRequest(reqId);
      await load();
    } catch (err) {
      alert(err?.response?.data?.msg || "Failed to cancel");
    }
  };

  if (!me) {
    return (
      <div className="text-slate-300 text-sm">
        Please login to see pending requests.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl border border-white/10 bg-zinc-900 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const backendMissing =
    incoming === undefined &&
    outgoing === undefined; // defensively handle if both calls fail

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Incoming */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
        <div className="font-semibold text-slate-100 mb-3">Incoming</div>
        {!backendMissing && incoming?.length ? (
          <div className="space-y-2">
            {incoming.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900/80 p-3"
              >
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${r.sender?._id}`)}>
                  <img
                    src={r.sender?.profilePic || "https://i.pravatar.cc/100?img=9"}
                    className="h-9 w-9 rounded-full ring-1 ring-white/10"
                    alt={r.sender?.username}
                  />
                  <div className="text-slate-100 text-sm">
                    {r.sender?.username}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => accept(r._id)}
                    className="px-3 py-1 rounded-md text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-400 text-[#04121a]"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => reject(r._id)}
                    className="px-3 py-1 rounded-md text-sm border border-white/10 hover:border-red-400/50 text-slate-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400">
            {backendMissing
              ? "Incoming/outgoing endpoints aren’t live yet."
              : "No incoming requests."}
          </div>
        )}
      </div>

      {/* Outgoing */}
      <div className="rounded-xl border border-white/10 bg-zinc-900 p-4">
        <div className="font-semibold text-slate-100 mb-3">Outgoing</div>
        {!backendMissing && outgoing?.length ? (
          <div className="space-y-2">
            {outgoing.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900/80 p-3"
              >
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${r.receiver?._id}`)}>
                  <img
                    src={r.receiver?.profilePic || "https://i.pravatar.cc/100?img=7"}
                    className="h-9 w-9 rounded-full ring-1 ring-white/10"
                    alt={r.receiver?.username}
                  />
                  <div className="text-slate-100 text-sm">
                    {r.receiver?.username}
                  </div>
                </div>
                <button
                  onClick={() => cancel(r._id)}
                  className="px-3 py-1 rounded-md text-sm border border-white/10 hover:border-amber-400/50 text-slate-200"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400">
            {backendMissing
              ? "Incoming/outgoing endpoints aren’t live yet."
              : "No outgoing requests."}
          </div>
        )}
      </div>
    </div>
  );
}
