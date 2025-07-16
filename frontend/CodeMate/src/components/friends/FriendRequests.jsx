// FriendRequests.jsx
import { useEffect, useState } from "react";
import { acceptFriendRequest, getFriendRequests, rejectFriendRequest } from "../../api/friends";
import { useAuth } from "../../utils/auth";
import { motion } from "framer-motion";

const FriendRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res = await getFriendRequests(user._id);
      setRequests(res.data.requests);
    } catch (err) {
      console.error("Failed to fetch friend requests", err);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      fetchRequests();
    } catch (err) {
      console.error("Error accepting friend request", err);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting friend request", err);
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-white mb-4">Friend Requests</h2>
      {requests.length === 0 ? (
        <p className="text-gray-400">No pending requests</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <motion.div
              key={req._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-zinc-800 p-4 rounded shadow border border-zinc-700"
            >
              <div>
                <p className="text-white font-semibold">{req.sender.username}</p>
                <p className="text-gray-400 text-sm">sent you a friend request</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(req._id)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm font-medium text-white"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(req._id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm font-medium text-white"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequests;
