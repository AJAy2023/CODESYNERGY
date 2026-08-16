// src/pages/Profile/ViewProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../../api/config";
import { getToken } from "../../utils/auth";
import { useAuth } from "@/context/AuthContext";
import DashboardNavbar from "@/components/layout/DashboardNavbar";
import { ArrowLeft, Award, Users, Pencil, Save, X } from "lucide-react";

export default function ViewProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const meId = useMemo(
    () => currentUser?.id || currentUser?._id || localStorage.getItem("userId"),
    [currentUser]
  );
  const isSelf = meId && (meId === id || id === "me");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // friend state
  const [friendStatus, setFriendStatus] = useState(null);
  const [requestId, setRequestId] = useState(null); 
  const [busy, setBusy] = useState(false);

  // small inline edit (self only)
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editPic, setEditPic] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = getToken() || localStorage.getItem("token");
        const fetchId = (id === "me" || !id) ? meId : id;

        if (!fetchId) {
          setLoading(false);
          return;
        }

        // 1) Profile data
        const res = await axios.get(`${BASE_URL}/profile/${fetchId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data.profile);

        // Prep edit fields if self
        if (meId === id) {
          setEditBio(res.data.profile?.bio || "");
          setEditPic(res.data.profile?.profilePic || "");
        }

        // 2) Friend status (only if viewing someone else)
        if (meId && meId !== id) {
          const statusRes = await axios.get(`${BASE_URL}/friends/status/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const status = statusRes?.data?.status || "none";
          setFriendStatus(status);

          // 3) If status requires requestId, resolve it once here
          if (status === "incoming") {
            // find a pending where sender === viewed user & receiver === me
            const inc = await axios.get(`${BASE_URL}/friends/incoming/${meId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const match = (inc.data?.requests || []).find(
              (r) => r?.sender?._id === id
            );
            setRequestId(match?._id || null);
          } else if (status === "pending") {
            // find a pending where receiver === viewed user & sender === me
            const out = await axios.get(`${BASE_URL}/friends/outgoing/${meId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const match = (out.data?.requests || []).find(
              (r) => r?.receiver?._id === id
            );
            setRequestId(match?._id || null);
          } else {
            setRequestId(null);
          }
        } else {
          setFriendStatus(null);
          setRequestId(null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, meId]);

  // --- Friend actions ---
  const handleAddFriend = async () => {
    if (!meId) return;
    setBusy(true);
    try {
      await axios.post(
        `${BASE_URL}/friends/send`,
        { senderId: meId, receiverId: id },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setFriendStatus("pending");

      // resolve the requestId for cancel button
      const out = await axios.get(`${BASE_URL}/friends/outgoing/${meId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const match = (out.data?.requests || []).find(
        (r) => r?.receiver?._id === id
      );
      setRequestId(match?._id || null);
    } catch (err) {
      console.error("Error sending friend request:", err?.response?.data || err);
    } finally {
      setBusy(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestId) return;
    setBusy(true);
    try {
      await axios.delete(`${BASE_URL}/friends/cancel/${requestId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setFriendStatus("none");
      setRequestId(null);
    } catch (err) {
      console.error("Error canceling request:", err?.response?.data || err);
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async () => {
    if (!requestId) return;
    setBusy(true);
    try {
      await axios.post(
        `${BASE_URL}/friends/accept/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setFriendStatus("friends");
      setRequestId(null);
      // refresh friend count visually
      setProfile((p) =>
        p ? { ...p, friends: Array.isArray(p.friends) ? [...p.friends] : p.friends } : p
      );
    } catch (err) {
      console.error("Error accepting request:", err?.response?.data || err);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!requestId) return;
    setBusy(true);
    try {
      await axios.post(
        `${BASE_URL}/friends/reject/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setFriendStatus("none");
      setRequestId(null);
    } catch (err) {
      console.error("Error rejecting request:", err?.response?.data || err);
    } finally {
      setBusy(false);
    }
  };

  const handleUnfriend = async () => {
    setBusy(true);
    try {
      await axios.post(
        `${BASE_URL}/friends/delete`,
        { userId1: meId, userId2: id },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setFriendStatus("none");
    } catch (err) {
      console.error("Error unfriending:", err?.response?.data || err);
    } finally {
      setBusy(false);
    }
  };

  // --- Small inline profile edit (self only) ---
  const handleSaveProfile = async () => {
    setBusy(true);
    try {
      const token = getToken();
      const body = { bio: editBio, profilePic: editPic };
      await axios.put(`${BASE_URL}/profile/update`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile((p) => (p ? { ...p, ...body } : p));
      setEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err?.response?.data || err);
    } finally {
      setBusy(false);
    }
  };

  // --- Render Friend Action Button ---
  const renderFriendAction = () => {
    if (isSelf) return null; // never show for self

    switch (friendStatus) {
      case "none":
        return (
          <button
            onClick={handleAddFriend}
            disabled={busy}
            className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg text-black font-semibold transition disabled:opacity-60"
          >
            Add Friend
          </button>
        );
      case "pending":
        return (
          <button
            onClick={handleCancelRequest}
            disabled={busy || !requestId}
            className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg text-black font-semibold transition disabled:opacity-60 cursor-pointer"
          >
            Cancel Request
          </button>
        );
      case "incoming":
        return (
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={busy || !requestId}
              className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg text-black font-semibold transition disabled:opacity-60"
            >
              Accept
            </button>
            <button
              onClick={handleReject}
              disabled={busy || !requestId}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white font-semibold transition disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        );
      case "friends":
        return (
          <button
            onClick={handleUnfriend}
            disabled={busy}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white font-semibold transition disabled:opacity-60 cursor-pointer"
          >
            Unfriend
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] text-white flex items-center justify-center">
        <p className="text-lg animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] text-white flex items-center justify-center">
        <p className="text-lg text-red-400">Profile not found.</p>
      </div>
    );
  }

  // helpers for friends array which might be objects or ids
  const normalizedFriends =
    Array.isArray(profile.friends) &&
    profile.friends.map((f) =>
      typeof f === "string"
        ? { _id: f, username: "Friend", profilePic: "" }
        : f
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] text-white">
      {/* Navbar */}
      <DashboardNavbar />

      {/* Back Button */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition"
        >
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-[#161616] to-[#202020] rounded-xl p-6 shadow-lg border border-gray-800 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Picture */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500 flex items-center justify-center bg-gray-800">
            {profile.profilePic ? (
              <img
                src={profile.profilePic}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-emerald-400">
                {profile.username?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{profile.username}</h1>
                {!editing ? (
                  <p className="text-gray-400">{profile.bio || "No bio yet."}</p>
                ) : (
                  <div className="mt-2 grid gap-2">
                    <input
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Your bio"
                      className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm outline-none"
                    />
                    <input
                      value={editPic}
                      onChange={(e) => setEditPic(e.target.value)}
                      placeholder="Profile image URL"
                      className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Right-side controls */}
              <div className="flex items-center gap-3">
                {/* Friend Action (only when viewing others) */}
                {renderFriendAction()}

                {/* Self edit toggle */}
                {isSelf && (
                  !editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg flex items-center gap-2 text-black font-semibold transition"
                    >
                      <Pencil size={18} /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={busy}
                        className="bg-emerald-500 hover:bg-emerald-600 px-3 py-2 rounded-lg flex items-center gap-2 text-black font-semibold transition disabled:opacity-60"
                      >
                        <Save size={16} /> Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditBio(profile.bio || "");
                          setEditPic(profile.profilePic || "");
                        }}
                        className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg flex items-center gap-2 text-white transition"
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <Award size={20} /> {profile.coins || 0} Coins
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Users size={20} /> {normalizedFriends?.length || 0} Friends
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <h2 className="text-xl font-semibold mb-3">Badges</h2>
        <div className="bg-gradient-to-br from-[#161616] to-[#202020] rounded-xl p-4 border border-gray-800 min-h-[100px] flex items-center justify-center">
          {profile.badges?.length > 0 ? (
            <div className="flex gap-4 flex-wrap">
              {profile.badges.map((badge, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-900 rounded-lg border border-gray-700"
                >
                  {badge.icon ? (
                    <img
                      src={badge.icon}
                      alt={badge.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10" />
                  )}
                  <span className="text-sm text-gray-300">{badge.name || "Badge"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No badges earned yet.</p>
          )}
        </div>
      </div>

      {/* Friends */}
      <div className="max-w-5xl mx-auto px-4 mt-6 pb-10">
        <h2 className="text-xl font-semibold mb-3">Friends</h2>
        <div className="bg-gradient-to-br from-[#161616] to-[#202020] rounded-xl p-4 border border-gray-800 min-h-[100px]">
          {normalizedFriends?.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto">
              {normalizedFriends.map((friend, index) => {
                const fid = friend?._id || friend?.id;
                const name = friend?.username || "Friend";
                const pic = friend?.profilePic;
                return (
                  <div
                    key={fid || index}
                    onClick={() => {
                      if (!fid) return;
                      navigate(`/profile/${fid}`);
                    }}
                    className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer hover:opacity-80"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 bg-gray-800">
                      {pic ? (
                        <img src={pic} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="flex items-center justify-center h-full w-full text-lg font-bold text-emerald-400">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-300">{name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-4 text-sm">No friends yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
