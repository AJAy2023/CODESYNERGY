import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function MyProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const userId = user?.id || user?._id || localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
    } else {
      navigate(`/profile/${userId}`);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white">
      Redirecting to your profile...
    </div>
  );
}
