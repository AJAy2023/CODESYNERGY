import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// import { BASE_URL } from "../api/config";
import { BASE_URL } from "../../api/config";
import { ArrowLeft, Save } from "lucide-react";

export default function EditProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", bio: "", profilePic: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        if (!token || !userId) return navigate("/login");

        const res = await axios.get(`${BASE_URL}/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm({
          username: res.data.profile.username || "",
          bio: res.data.profile.bio || "",
          profilePic: res.data.profile.profilePic || "",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/profile/update`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate(`/profile/${localStorage.getItem("userId")}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/5 p-6 rounded-xl border border-white/10 max-w-xl mx-auto"
      >
        <h1 className="text-xl font-bold mb-4">Edit Profile</h1>

        <label className="block mb-3">
          <span className="text-sm text-slate-300">Username</span>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-slate-300">Bio</span>
          <textarea
            name="bio"
            rows={3}
            value={form.bio}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-slate-300">Profile Picture URL</span>
          <input
            type="text"
            name="profilePic"
            value={form.profilePic}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
          />
        </label>

        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 mt-4 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
        >
          <Save size={18} /> Save Changes
        </button>
      </form>
    </div>
  );
}
