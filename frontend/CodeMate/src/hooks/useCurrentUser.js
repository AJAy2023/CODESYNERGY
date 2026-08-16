import { useAuth } from "../context/AuthContext";

export default function useCurrentUser() {
  const { user, loading } = useAuth();

  return {
    user,
    userId: user?.id || user?._id,
    isLoaded: !loading,
    isSignedIn: !!user,
  };
}



