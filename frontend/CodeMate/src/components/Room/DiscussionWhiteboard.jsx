// src/components/Room/DiscussionWhiteboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { Pencil, Eraser as EraserIcon, Trash2, Save, Hand } from "lucide-react";

export default function DiscussionWhiteboard({ roomId, socket, isHost, disableDrawing }) {
  const CSS_WIDTH = 2400;
  const CSS_HEIGHT = 1600;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#2563eb");
  const [size, setSize] = useState(3);

  const drawingRef = useRef(false);
  const lastPointsRef = useRef(null);
  const panningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });

  // --- init canvas ---
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.style.width = `${CSS_WIDTH}px`;
    canvas.style.height = `${CSS_HEIGHT}px`;
    canvas.width = CSS_WIDTH * dpr;
    canvas.height = CSS_HEIGHT * dpr;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CSS_WIDTH, CSS_HEIGHT);
  };

  useEffect(() => {
    initCanvas();
    const handle = () => initCanvas();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  // --- helpers ---
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const norm = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
  };
  const denorm = (pt) => ({ x: pt.x * CSS_WIDTH, y: pt.y * CSS_HEIGHT });

  const paintStroke = (stroke) => {
    const ctx = ctxRef.current;
    if (!ctx || !stroke || !Array.isArray(stroke.points) || stroke.points.length < 2) return;

    const mode = stroke.mode || "pen";
    const prevComp = ctx.globalCompositeOperation;
    if (mode === "eraser") ctx.globalCompositeOperation = "destination-out";

    ctx.strokeStyle = stroke.color || color;
    ctx.lineWidth = stroke.size || size;

    ctx.beginPath();
    const p0 = denorm(stroke.points[0]);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < stroke.points.length; i++) {
      const p = denorm(stroke.points[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    ctx.globalCompositeOperation = prevComp;
  };

  const emitStroke = (stroke) => {
    const payload = { roomId, stroke };
    try {
      socket.emit("whiteboard-update", payload);
      socket.emit("whiteboard-draw", payload);
    } catch {}
  };

  const clearLocal = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CSS_WIDTH, CSS_HEIGHT);
  };

  const emitClear = () => {
    try {
      socket.emit("whiteboard-clear", { roomId });
    } catch {}
  };

  // --- pointer handlers ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const scroller = containerRef.current;
    if (!canvas || !scroller) return;

    const onPointerDown = (e) => {
      if (!isHost || disableDrawing) return;

      if (tool === "hand") {
        panningRef.current = true;
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          left: scroller.scrollLeft,
          top: scroller.scrollTop,
        };
        return;
      }
      drawingRef.current = true;
      lastPointsRef.current = [norm(e.clientX, e.clientY)];
    };

    const onPointerMove = (e) => {
      if (panningRef.current && tool === "hand") {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        scroller.scrollLeft = panStartRef.current.left - dx;
        scroller.scrollTop = panStartRef.current.top - dy;
        return;
      }
      if (!drawingRef.current || !isHost || disableDrawing) return;

      const p = norm(e.clientX, e.clientY);
      const last = lastPointsRef.current;
      if (!last) return;

      last.push(p);
      const chunk = last.length >= 2 ? [last[last.length - 2], last[last.length - 1]] : last;
      const strokeChunk = {
        points: chunk,
        color,
        size,
        mode: tool === "eraser" ? "eraser" : "pen",
        ts: Date.now(),
      };
      paintStroke(strokeChunk);
      emitStroke(strokeChunk);
    };

    const endStroke = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      const last = lastPointsRef.current;
      if (!last || last.length < 2) {
        lastPointsRef.current = null;
        return;
      }
      emitStroke({ points: last, color, size, mode: tool === "eraser" ? "eraser" : "pen", ts: Date.now() });
      lastPointsRef.current = null;
    };

    const onPointerUp = () => {
      if (panningRef.current) {
        panningRef.current = false;
        return;
      }
      endStroke();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
    };
  }, [isHost, disableDrawing, color, size, tool]);

  // --- socket listeners ---
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (payload) => payload?.roomId === roomId && paintStroke(payload.stroke);
    const onClear = (payload) => payload?.roomId === roomId && clearLocal();

    socket.on("whiteboard-update", onUpdate);
    socket.on("whiteboard-clear", onClear);
    socket.on("whiteboard-draw", onUpdate);

    return () => {
      socket.off("whiteboard-update", onUpdate);
      socket.off("whiteboard-clear", onClear);
      socket.off("whiteboard-draw", onUpdate);
    };
  }, [socket, roomId]);

  const clearBoard = () => {
    if (!isHost) return;
    clearLocal();
    emitClear();
  };
  const downloadPNG = () => {
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const isViewer = !isHost || !!disableDrawing;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded">
          <button onClick={() => setTool("pen")} disabled={isViewer} className={`p-2 rounded ${tool==="pen"?"bg-slate-700":""}`}>
            <Pencil size={18} />
          </button>
          <button onClick={() => setTool("eraser")} disabled={isViewer} className={`p-2 rounded ${tool==="eraser"?"bg-slate-700":""}`}>
            <EraserIcon size={18} />
          </button>
          <button onClick={() => setTool("hand")} className={`p-2 rounded ${tool==="hand"?"bg-slate-700":""}`}>
            <Hand size={18} />
          </button>
        </div>
        <div className={`flex items-center gap-2 ${isViewer?"opacity-50":""}`}>
          {["#2563eb","#10b981","#ef4444","#f59e0b","#6b21a8","#000000"].map((c) => (
            <button key={c} onClick={() => !isViewer && (setColor(c), setTool("pen"))}
              className="w-6 h-6 rounded border border-slate-600" style={{background:c,outline:color===c?"2px solid white":"none"}} />
          ))}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <label className="text-xs">Size</label>
          <input type="range" min="1" max="40" value={size} onChange={(e)=>setSize(Number(e.target.value))} className="w-40" disabled={isViewer}/>
          <span className="text-xs w-6 text-center">{size}</span>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={downloadPNG} className="px-2 py-1 rounded bg-slate-800"><Save size={16}/></button>
          <button onClick={clearBoard} disabled={isViewer} className={`px-2 py-1 rounded ${isViewer?"bg-slate-700 opacity-50":"bg-red-500 text-white"}`}><Trash2 size={16}/></button>
        </div>
      </div>

      {/* ✅ Scrollable whiteboard container only */}
      <div
        ref={containerRef}
        className="bg-white rounded border"
        style={{ flex: 1, overflow: "auto", maxHeight: "70vh" }}
      >
        <canvas ref={canvasRef} style={{ display:"block", touchAction:"none", margin:16 }} />
      </div>
    </div>
  );
}
