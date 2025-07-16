// components/friends/FriendCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { UserX, UserCheck, UserMinus } from "lucide-react";

const FriendCard = ({ user, type, onAccept, onReject, onUnfriend }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center justify-between bg-zinc-800 border border-zinc-700 hover:border-cyan-500 p-4 rounded-lg shadow-md mb-3"
    >
      <div className="flex items-center gap-4">
        <img
          src={user.profilePic || "/default-avatar.png"}
          alt={user.username}
          className="w-12 h-12 rounded-full object-cover"
        />
        <span className="text-white font-medium">{user.username}</span>
      </div>

      <div className="flex gap-2">
        {type === "request" && (
          <>
            <button
              onClick={() => onAccept(user._id)}
              className="px-3 py-1 text-green-400 border border-green-500 rounded hover:bg-green-600 hover:text-white"
            >
              <UserCheck size={16} />
            </button>
            <button
              onClick={() => onReject(user._id)}
              className="px-3 py-1 text-red-400 border border-red-500 rounded hover:bg-red-600 hover:text-white"
            >
              <UserX size={16} />
            </button>
          </>
        )}

        {type === "friend" && (
          <button
            onClick={() => onUnfriend(user._id)}
            className="px-3 py-1 text-yellow-400 border border-yellow-500 rounded hover:bg-yellow-600 hover:text-black"
          >
            <UserMinus size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default FriendCard;
