// src/components/VideoTile.jsx
import React from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

const VideoTile = ({ username, videoRef, micOn, videoOn }) => {
  return (
    <div className="relative w-48 h-36 bg-zinc-800 rounded-lg shadow-md overflow-hidden border border-zinc-600">
      <video
        ref={videoRef}
        autoPlay
        muted={!micOn}
        className="w-full h-full object-cover rounded"
      />

      {/* Overlay bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 px-2 py-1 flex justify-between items-center text-xs text-white">
        <span className="truncate">{username}</span>
        <div className="flex gap-1">
          {micOn ? (
            <Mic size={14} className="text-green-400" />
          ) : (
            <MicOff size={14} className="text-red-500" />
          )}
          {videoOn ? (
            <Video size={14} className="text-green-400" />
          ) : (
            <VideoOff size={14} className="text-red-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoTile;
