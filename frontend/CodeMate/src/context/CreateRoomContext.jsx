// src/context/CreateRoomContext.jsx
import { createContext, useContext, useState } from "react";

const CreateRoomContext = createContext();

export const CreateRoomProvider = ({ children }) => {
  const [selectedProblem, setSelectedProblem] = useState(null);

  return (
    <CreateRoomContext.Provider value={{ selectedProblem, setSelectedProblem }}>
      {children}
    </CreateRoomContext.Provider>
  );
};

export const useCreateRoom = () => useContext(CreateRoomContext);

  