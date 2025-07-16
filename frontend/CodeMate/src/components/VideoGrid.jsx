import React from "react";

const VideoGrid = ({ participants }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
      {participants.map((participant, index) => (
        <div
          key={index}
          className="relative border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800"
        >
          <video
            ref={participant.videoRef}
            autoPlay
            playsInline
            muted={participant.isLocal}
            className="w-full h-48 object-cover"
          />
          <div className="absolute bottom-0 w-full px-2 py-1 bg-black/50 text-white text-xs flex justify-between items-center">
            <span>{participant.username}</span>
            <div className="flex gap-2">
              {!participant.micOn && (
                <span className="text-red-500 font-semibold">🎤 Off</span>
              )}
              {!participant.videoOn && (
                <span className="text-red-500 font-semibold">📷 Off</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
