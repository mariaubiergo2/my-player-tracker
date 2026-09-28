"use client";

import React, { createContext, useContext } from "react";

export type Theme = "nexa";

type ThemeContextType = {
  theme: Theme;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "nexa",
});

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
  initialTheme?: string;
}) {
  return (
    <ThemeContext.Provider value={{ theme: "nexa" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
