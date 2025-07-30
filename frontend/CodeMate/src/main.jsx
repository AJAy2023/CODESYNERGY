// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import "./index.css";
// import { CreateRoomProvider } from './context/CreateRoomContext';

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//    {/* <BrowserRouter> */}
//      <CreateRoomProvider>
//        <App />
//     </CreateRoomProvider>
//     {/* </BrowserRouter> */}
//   </React.StrictMode>
// );

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { CreateRoomProvider } from "./context/CreateRoomContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <CreateRoomProvider>
        <App />
      </CreateRoomProvider>
    </BrowserRouter>
  </React.StrictMode>
);
