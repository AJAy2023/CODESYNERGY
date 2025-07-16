// SendRequest.jsx
import { useState, useEffect } from "react";
import { sendFriendRequest, searchUsers } from "../../api/friends";
import { useAuth } from "../../utils/auth";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

const SendRequest = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const handleSearch = (text) => {
    setQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(async () => {
      if (!text.trim()) return setResults([]);
      setLoading(true);
      try {
        const res = await searchUsers(text);
        setResults(res);
      } catch (err) {
        toast.error("Error fetching users");
      } finally {
        setLoading(false);
      }
    }, 400);

    setDebounceTimer(timer);
  };

  const handleSendRequest = async (receiverId) => {
    try {
      await sendFriendRequest(user._id, receiverId);
      toast.success("Request sent!");
      setResults((prev) => prev.filter((u) => u._id !== receiverId));
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to send request");
    }
  };

  return (
    <div className="p-6 text-white min-h-screen bg-gradient-to-br from-black via-gray-900 to-zinc-900">
      <h2 className="text-2xl font-bold mb-4">Send Friend Request</h2>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by username..."
        className="w-full p-2 rounded-md border bg-zinc-800 border-zinc-700 text-white mb-4"
      />

      {loading ? (
        <p>Loading...</p>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((u) => (
            <motion.div
              key={u._id}
              whileHover={{ scale: 1.01 }}
              className="flex justify-between items-center bg-zinc-800 p-4 rounded-md border border-zinc-700"
            >
              <div className="flex items-center gap-4">
                <img
                  src={u.profilePic || "/default-avatar.png"}
                  alt={u.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <p className="text-lg font-semibold">{u.username}</p>
              </div>
              <button
                onClick={() => handleSendRequest(u._id)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md text-white"
              >
                Send Request
              </button>
            </motion.div>
          ))}
        </div>
      ) : query.trim() !== "" ? (
        <p>No users found.</p>
      ) : null}
    </div>
  );
};

export default SendRequest;
