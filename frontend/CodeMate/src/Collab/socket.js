// src/Collab/socket.js
import { io } from "socket.io-client";

//  Backend Socket Server
const socket = io("http://localhost:8000/",  
  //   ,           https://codemate-1-nuih.onrender.com
   {
  transports: ["websocket"],
  withCredentials: true,
});

export default socket; 
