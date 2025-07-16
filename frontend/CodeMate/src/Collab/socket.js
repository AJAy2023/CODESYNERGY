// src/Collab/socket.js
import { io } from "socket.io-client";

// Connect to your backend WebSocket server
const URL = "http://localhost:8000"; // Ensure your friend starts this server

export const socket = io(URL, {
  autoConnect: false,
  transports: ["websocket"],
});
