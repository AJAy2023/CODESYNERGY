// FriendList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import FriendCard from "./FriendCard";
import { BASE_URL } from "@/api/config";

const FriendList = ({ userId }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/friends/list/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFriends(res.data.friends);
    } catch (err) {
      console.error("Failed to fetch friend list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchFriends();
  }, [userId]);

  if (loading) return <p className="text-white">Loading friends...</p>;

  if (!friends.length)
    return <p className="text-gray-400 text-sm">No friends yet 😔</p>;

  return (
    <div className="grid gap-4">
      {friends.map((friend) => (
        <FriendCard key={friend._id} user={friend} showActions={false} />
      ))}
    </div>
  );
};

export default FriendList;
