import React, { useRef, useEffect, useState } from "react";
import { socket } from "../Collab/socket"; // Adjust if your socket.js file is elsewhere
import Toolbar from "./Toolbar";

const Whiteboard = ({ roomId }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [color, setColor] = useState("black");
  const [size, setSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.7;
    canvas.style.background = "#ffffff";
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = size;
    }
  }, [color, size]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();

    // Broadcast the drawing action
    socket.emit("draw", {
      roomId,
      offsetX,
      offsetY,
      color,
      size,
    });
  };

  useEffect(() => {
    socket.on("draw", ({ offsetX, offsetY, color, size }) => {
      if (!ctxRef.current) return;
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = size;
      ctxRef.current.lineTo(offsetX, offsetY);
      ctxRef.current.stroke();
    });

    return () => socket.off("draw");
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-canvas", { roomId });
  };

  useEffect(() => {
    socket.on("clear-canvas", () => {
      const canvas = canvasRef.current;
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => socket.off("clear-canvas");
  }, []);

  return (
    <div className="p-4 bg-zinc-800 rounded-lg mt-6">
      <Toolbar
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        clearCanvas={clearCanvas}
      />
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing}
        className="mt-4 border border-zinc-600 rounded shadow"
      />
    </div>
  );
};

export default Whiteboard;
