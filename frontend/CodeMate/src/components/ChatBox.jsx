import React from "react";

const ChatBox = ({ chatOpen, messages, inputMsg, setInputMsg, handleSendMessage, handleKeyPress }) => {
  if (!chatOpen) return null;

  return (
    <div className="w-full md:w-1/3 lg:w-1/4 bg-zinc-800 p-4 flex flex-col border-l border-zinc-600 h-full">
      <h3 className="text-lg font-bold text-yellow-400 mb-2">Live Chat</h3>
      <div className="flex-grow overflow-y-auto space-y-2 scrollbar-thin pr-2">
        {messages.map((msg, idx) => (
          <div key={idx} className="bg-zinc-700 p-2 rounded text-sm">
            <strong className="text-blue-300">{msg.username}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <div className="flex mt-3 gap-2">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type message..."
          className="flex-grow px-3 py-2 bg-zinc-700 rounded border border-zinc-600 text-white"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 hover:bg-blue-500 px-4 rounded text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
