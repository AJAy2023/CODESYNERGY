import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../api/config";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Coins, User, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const SearchFriend = () => {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/user-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(async () => {
      if (!text.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/friends/search?query=${text}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuggestions(res.data.users || []);
      } catch (err) {
        console.error("Search failed:", err);
        setSuggestions([]);
      }
    }, 400);

    setDebounceTimer(timer);
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  return (
    <div className="bg-gradient-to-b from-black via-gray-900 to-zinc-900 min-h-screen p-6 text-white">
      {/* Top Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          <h1
            onClick={() => navigate("/dashboard")}
            className="text-3xl font-extrabold text-cyan-400 tracking-wide cursor-pointer"
          >
            CodeMate
          </h1>

          {user && (
            <div className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded text-green-400">
              <Coins size={16} />
              <span className="text-sm font-bold">{user.coins ?? 0} Coins</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Bell className="cursor-pointer hover:text-yellow-300" />
          <User
            className="cursor-pointer hover:text-blue-400"
            onClick={() => navigate("/profile")}
          />
        </div>
      </div>

      {/* Title and Back */}
      <div className="flex items-center gap-2 mb-6">
        <ArrowLeft
          onClick={() => navigate("/dashboard")}
          className="cursor-pointer hover:text-cyan-400"
        />
        <h2 className="text-2xl font-bold">Search Friends</h2>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md mx-auto mb-8">
        <div className="flex items-center bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700 shadow">
          <Search className="text-gray-400" size={18} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search for friends..."
            className="ml-2 bg-transparent outline-none w-full text-white text-sm"
          />
        </div>

        {suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-10 mt-2 w-full bg-zinc-800 border border-zinc-700 rounded-md max-h-64 overflow-y-auto shadow-md"
          >
            {suggestions.map((user) => (
              <li
                key={user._id}
                onClick={() => handleUserClick(user.username)}
                className="px-4 py-2 hover:bg-zinc-700 cursor-pointer flex items-center gap-3"
              >
                <img
                  src={user.profilePic || "/default-profile.png"}
                  alt="pfp"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-sm">{user.username}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
};

export default SearchFriend;
