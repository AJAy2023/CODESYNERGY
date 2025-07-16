import { ArrowLeftIcon, BoltIcon, EyeIcon, EyeOffIcon, LockIcon, UnlockIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TopBarControls = ({
  roomId,
  problem,
  isPrivate,
  setIsPrivate,
  isLive,
  setIsLive,
  fetchAndStartBattle,
  startVideoCall,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-3">
        <ArrowLeftIcon
          onClick={() => navigate("/dashboard")}
          className="cursor-pointer text-zinc-300 hover:text-yellow-400"
        />
        <h2 className="text-xl font-bold text-cyan-400">Room ID: {roomId}</h2>
        {problem?.title && (
          <p className="ml-4 italic text-sm text-gray-400">Problem: {problem.title}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setIsPrivate((prev) => !prev)}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded flex items-center gap-2"
        >
          {isPrivate ? <LockIcon size={18} /> : <UnlockIcon size={18} />}{" "}
          {isPrivate ? "Private" : "Public"}
        </button>
        <button
          onClick={() => setIsLive((prev) => !prev)}
          className="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded flex items-center gap-2"
        >
          {isLive ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}{" "}
          {isLive ? "End Stream" : "Go Live"}
        </button>
        <button
          onClick={startVideoCall}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
        >
          Start Call
        </button>
        <button
          onClick={fetchAndStartBattle}
          className="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded flex items-center gap-2"
        >
          <BoltIcon size={18} /> Start Battle
        </button>
      </div>
    </div>
  );
};

export default TopBarControls;
