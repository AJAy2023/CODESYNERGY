// src/components/Room/DiscussionWhiteboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { Pencil, Eraser as EraserIcon, Trash2, Save, Hand, Square, Circle, Minus } from "lucide-react";

export default function DiscussionWhiteboard({ roomId, socket, isHost, disableDrawing, canDraw }) {
  const CSS_WIDTH = 2000;
  const CSS_HEIGHT = 1400;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#06b6d4"); // Cyan default
  const [size, setSize] = useState(4);

  const drawingRef = useRef(false);
  const lastPointsRef = useRef([]);
  const panningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const startPointRef = useRef(null);

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

  // Smooth stroke painting using quadratic curves
  const paintStroke = (stroke) => {
    const ctx = ctxRef.current;
    if (!ctx || !stroke || !Array.isArray(stroke.points) || stroke.points.length < 1) return;

    const mode = stroke.mode || "pen";
    const prevComp = ctx.globalCompositeOperation;
    if (mode === "eraser") ctx.globalCompositeOperation = "destination-out";

    ctx.strokeStyle = stroke.color || color;
    ctx.lineWidth = stroke.size || size;

    const pts = stroke.points.map(denorm);

    if (mode === "rectangle" && pts.length >= 2) {
      const p0 = pts[0];
      const p1 = pts[pts.length - 1];
      ctx.beginPath();
      ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    } else if (mode === "circle" && pts.length >= 2) {
      const p0 = pts[0];
      const p1 = pts[pts.length - 1];
      const rx = Math.abs(p1.x - p0.x) / 2;
      const ry = Math.abs(p1.y - p0.y) / 2;
      const cx = Math.min(p0.x, p1.x) + rx;
      const cy = Math.min(p0.y, p1.y) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (mode === "line" && pts.length >= 2) {
      const p0 = pts[0];
      const p1 = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    } else if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, (stroke.size || size) / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color || color;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = prevComp;
  };

  const emitStroke = (stroke) => {
    const payload = { roomId, stroke };
    try {
      if (socket) {
        socket.emit("whiteboard-update", payload);
        socket.emit("whiteboard-draw", payload);
      }
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
      if (socket) socket.emit("whiteboard-clear", { roomId });
    } catch {}
  };

  // --- pointer handlers ---
  const isEditable = canDraw ?? (isHost && !disableDrawing);

  useEffect(() => {
    const canvas = canvasRef.current;
    const scroller = containerRef.current;
    if (!canvas || !scroller) return;

    const onPointerDown = (e) => {
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
      if (!isEditable) return;
      drawingRef.current = true;
      const pt = norm(e.clientX, e.clientY);
      startPointRef.current = pt;
      lastPointsRef.current = [pt];
    };

    const onPointerMove = (e) => {
      if (panningRef.current && tool === "hand") {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        scroller.scrollLeft = panStartRef.current.left - dx;
        scroller.scrollTop = panStartRef.current.top - dy;
        return;
      }
      if (!drawingRef.current || !isEditable) return;

      const p = norm(e.clientX, e.clientY);
      const last = lastPointsRef.current;
      if (!last) return;

      last.push(p);

      if (tool === "pen" || tool === "eraser") {
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
      }
    };

    const endStroke = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      const last = lastPointsRef.current;
      if (!last || last.length < 1) {
        lastPointsRef.current = [];
        return;
      }

      if (tool === "rectangle" || tool === "circle" || tool === "line") {
        const shapeStroke = {
          points: [startPointRef.current, last[last.length - 1]],
          color,
          size,
          mode: tool,
          ts: Date.now(),
        };
        paintStroke(shapeStroke);
        emitStroke(shapeStroke);
      }
      lastPointsRef.current = [];
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
  }, [isEditable, color, size, tool]);

  // --- socket listeners & history sync ---
  useEffect(() => {
    if (!socket) return;

    socket.emit("request-whiteboard-history", { roomId });

    const onInit = (data) => {
      if (Array.isArray(data?.strokes)) {
        data.strokes.forEach((stroke) => paintStroke(stroke));
      }
    };

    const onUpdate = (payload) => {
      if (payload?.stroke) paintStroke(payload.stroke);
    };

    const onClear = () => clearLocal();

    socket.on("whiteboard-init", onInit);
    socket.on("whiteboard-update", onUpdate);
    socket.on("whiteboard-draw", onUpdate);
    socket.on("whiteboard-clear", onClear);

    return () => {
      socket.off("whiteboard-init", onInit);
      socket.off("whiteboard-update", onUpdate);
      socket.off("whiteboard-draw", onUpdate);
      socket.off("whiteboard-clear", onClear);
    };
  }, [socket, roomId]);

  const clearBoard = () => {
    if (!isEditable) return;
    clearLocal();
    emitClear();
  };

  const downloadPNG = () => {
    const link = document.createElement("a");
    link.download = `discussion-whiteboard-${roomId}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-3 bg-zinc-900/90 p-2.5 rounded-xl border border-white/10 shadow-lg">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setTool("pen")}
            disabled={!isEditable}
            title="Pencil"
            className={`p-2 rounded-md transition ${tool === "pen" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"}`}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setTool("line")}
            disabled={!isEditable}
            title="Line"
            className={`p-2 rounded-md transition ${tool === "line" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"}`}
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => setTool("rectangle")}
            disabled={!isEditable}
            title="Rectangle"
            className={`p-2 rounded-md transition ${tool === "rectangle" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"}`}
          >
            <Square size={16} />
          </button>
          <button
            onClick={() => setTool("circle")}
            disabled={!isEditable}
            title="Circle"
            className={`p-2 rounded-md transition ${tool === "circle" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"}`}
          >
            <Circle size={16} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            disabled={!isEditable}
            title="Eraser"
            className={`p-2 rounded-md transition ${tool === "eraser" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"}`}
          >
            <EraserIcon size={16} />
          </button>
          <button
            onClick={() => setTool("hand")}
            title="Pan Hand"
            className={`p-2 rounded-md transition ${tool === "hand" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"}`}
          >
            <Hand size={16} />
          </button>
        </div>

        {/* Colors */}
        <div className={`flex items-center gap-1.5 p-1 bg-zinc-950 rounded-lg border border-white/10 ${!isEditable ? "opacity-40" : ""}`}>
          {["#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#a855f7", "#ffffff", "#000000"].map((c) => (
            <button
              key={c}
              onClick={() => isEditable && (setColor(c), setTool((t) => (t === "eraser" ? "pen" : t)))}
              className="w-5 h-5 rounded-full border border-white/20 transition hover:scale-110"
              style={{ background: c, outline: color === c ? "2px solid #06b6d4" : "none" }}
            />
          ))}
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 px-2 py-1 bg-zinc-950 rounded-lg border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400">Size</span>
          <input
            type="range"
            min="2"
            max="30"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-24 accent-cyan-400"
            disabled={!isEditable}
          />
          <span className="text-xs font-mono font-bold text-cyan-300 w-4 text-center">{size}</span>
        </div>

        {/* Actions */}
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={downloadPNG}
            title="Save PNG"
            className="p-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-slate-200 border border-white/10 transition"
          >
            <Save size={16} />
          </button>
          <button
            onClick={clearBoard}
            disabled={!isEditable}
            title="Clear Canvas"
            className={`p-2 rounded-lg transition ${!isEditable ? "bg-zinc-950 text-slate-600 border border-white/5 opacity-50 cursor-not-allowed" : "bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40"}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Canvas Scroll Container */}
      <div
        ref={containerRef}
        className="bg-white rounded-2xl border border-white/10 shadow-2xl relative overflow-auto"
        style={{ flex: 1, maxHeight: "calc(100vh - 180px)" }}
      >
        <canvas ref={canvasRef} style={{ display: "block", touchAction: "none" }} />
      </div>
    </div>
  );
}
