import React, { useEffect, useState } from "react";
import { Toggle } from "./toggle";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark") return true;
      if (stored === "light") return false;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const html = document.documentElement;
      const body = document.body;
      if (isDark) {
        html.classList.add("dark");
        body.classList.add("dark");
      } else {
        html.classList.remove("dark");
        body.classList.remove("dark");
      }
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (e) {
      // ignore
    }
  }, [isDark]);

  return (
    <Toggle
      pressed={isDark}
      onPressedChange={(v: boolean) => setIsDark(!!v)}
      aria-label={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
      title={isDark ? "Tema: Escuro" : "Tema: Claro"}
      className="px-2"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Toggle>
  );
}
