// src/components/friends/SearchFriend.jsx
import { useEffect, useState } from "react";
import { searchUsers, sendFriendRequest } from "../../api/friends";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SearchFriend() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [sendingId, setSendingId] = useState(null);
  const [searching, setSearching] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const me = localStorage.getItem("userId");

  const doSearch = async (q) => {
    if (!q?.trim()) {
      setResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await searchUsers(q.trim());
      setResults(res?.data?.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const q = params.get("query");
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, [params]);

  const handleSend = async (receiverId) => {
    if (!me) {
      alert("Please login first");
      return;
    }
    if (me === receiverId) return;

    try {
      setSendingId(receiverId);
      await sendFriendRequest(me, receiverId);
      alert("Friend request sent!");
    } catch (err) {
      alert(err?.response?.data?.msg || "Failed to send request");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch(query)}
          placeholder="Search by username…"
          className="flex-1 px-3 py-2 rounded-md bg-zinc-900 border border-white/10 text-slate-100 outline-none"
        />
        <button
          onClick={() => doSearch(query)}
          className="px-4 py-2 rounded-md font-semibold bg-gradient-to-r from-sky-500 to-cyan-400 text-[#04121a]"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Results */}
      <div className="mt-4 space-y-2">
        {results.map((u) => {
          const isMe = me === u._id;
          return (
            <div
              key={u._id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900/80 p-3"
            >
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate(`/view-profile/${u._id}`)}
              >
                <img
                  src={u.profilePic || "https://i.pravatar.cc/100?img=5"}
                  alt={u.username}
                  className="h-10 w-10 rounded-full ring-1 ring-white/10 object-cover"
                />
                <div className="text-slate-100 font-medium">
                  {u.username}
                  {isMe && (
                    <span className="ml-2 text-xs text-slate-400">(you)</span>
                  )}
                </div>
              </div>

              {!isMe && (
                <button
                  onClick={() => handleSend(u._id)}
                  disabled={sendingId === u._id}
                  className={`px-3 py-1 rounded-md text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-400 text-[#04121a] ${
                    sendingId === u._id ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {sendingId === u._id ? "Sending…" : "Add"}
                </button>
              )}
            </div>
          );
        })}

        {!results.length && !searching && (
          <div className="text-sm text-slate-400">
            No results yet — try searching a username.
          </div>
        )}
      </div>
    </div>
  );
}
