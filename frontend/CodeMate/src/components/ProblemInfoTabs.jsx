import React from "react";

const ProblemInfoTabs = ({ activeTab, setActiveTab, problem }) => {
  const tabs = ["description", "testcases", "hints"];

  return (
    <div className="mb-4">
      <div className="flex gap-4 mb-2 border-b border-zinc-600 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize px-3 py-1 rounded ${
              activeTab === tab
                ? "bg-zinc-700 text-yellow-400"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="bg-zinc-800 rounded p-3 text-sm">
        {activeTab === "description" && (
          <>
            <h4 className="text-lg font-semibold text-cyan-400 mb-1">{problem?.title}</h4>
            <p>{problem?.statement || "No description provided."}</p>
          </>
        )}
        {activeTab === "testcases" && (
          <pre className="whitespace-pre-wrap">
            <strong className="text-green-400">Input:</strong> {problem?.input || "N/A"}
            {"\n"}
            <strong className="text-red-400">Output:</strong> {problem?.output || "N/A"}
          </pre>
        )}
        {activeTab === "hints" && (
          <ul className="list-disc pl-4 space-y-1">
            {problem?.hints?.length > 0 ? (
              problem.hints.map((hint, i) => <li key={i}>{hint}</li>)
            ) : (
              <li>No hints available.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProblemInfoTabs;
