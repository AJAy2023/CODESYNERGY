// src/components/Editor.jsx
import { useEffect, useRef, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

const COLORS = [
  "#f43f5e", "#8b5cf6", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#a855f7"
];

const CodeEditor = ({ socket, roomId, username, value, onChange }) => {
  const monacoInstance = useMonaco();
  const editorRef = useRef(null);
  const [userColorMap, setUserColorMap] = useState({});

  useEffect(() => {
    if (!socket || !username) return;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    setUserColorMap((prev) => ({ ...prev, [username]: color }));
  }, [socket, username]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      socket.emit("cursor-move", {
        roomId,
        username,
        position: e.position,
      });
    });

    editor.onDidChangeModelContent((event) => {
      const code = editor.getValue();
      onChange(code);
    });
  };

  useEffect(() => {
    if (!socket || !editorRef.current) return;

    const editor = editorRef.current;

    socket.on("cursor-move", ({ username: sender, position }) => {
      if (sender === username) return;

      const color =
        userColorMap[sender] || COLORS[Math.floor(Math.random() * COLORS.length)];
      setUserColorMap((prev) => ({ ...prev, [sender]: color }));

      const decoration = editor.deltaDecorations([], [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          options: {
            className: "remote-cursor",
            after: {
              content: `▌${sender}`,
              inlineClassName: "remote-label",
            },
          },
        },
      ]);

      setTimeout(() => {
        editor.deltaDecorations(decoration, []);
      }, 3000);
    });

    return () => {
      socket.off("cursor-move");
    };
  }, [socket, username, userColorMap]);

  const handleRunCode = () => {
    const code = editorRef.current?.getValue();
    alert("You clicked RUN! Your code is:\n\n" + code);
    // You can integrate judge0 or backend API here.
  };

  return (
    <>
      <style>{`
        .remote-cursor {
          border-left: 2px solid #facc15;
        }
        .remote-label {
          background: #facc15;
          color: black;
          font-size: 11px;
          padding: 1px 4px;
          border-radius: 4px;
          margin-left: 4px;
        }
      `}</style>

      <div className="relative">
        <Editor
          height="75vh"
          theme="vs-dark"
          language="javascript"
          value={value}
          onChange={onChange}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
        <button
          onClick={handleRunCode}
          className="absolute right-4 top-2 z-10 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded shadow"
        >
          Run
        </button>
      </div>
    </>
  );
};

export default CodeEditor;
