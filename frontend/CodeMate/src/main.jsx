import React from "react";
import { ClerkProvider } from "@clerk/react";

import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { CreateRoomProvider } from "./context/CreateRoomContext.jsx";
const  clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey} >
    <BrowserRouter>
      <CreateRoomProvider>
        <App />
      </CreateRoomProvider>
    </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
