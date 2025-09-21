import React, { createContext, useContext, useState } from "react";

const SelectionContext = createContext(null);

export function SelectionProvider({ children }) {
  const [farm, setFarm] = useState(null); // { id, name }
  return (
    <SelectionContext.Provider value={{ farm, setFarm }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}
