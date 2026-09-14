"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({
  variant = "button",
  className = "",
}: {
  variant?: "button" | "compact";
  className?: string;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`rounded-xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse ${
          variant === "compact" ? "w-8 h-8" : "w-full h-10"
        } ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-tp-cyan hover:border-tp-cyan/50 dark:hover:border-tp-cyan/50 shadow-sm transition-all active:scale-95 flex items-center justify-center ${className}`}
        aria-label={isDark ? "Basculer en Mode Clair" : "Basculer en Mode Sombre"}
        title={isDark ? "Basculer en Mode Clair" : "Basculer en Mode Sombre"}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between shadow-sm active:scale-95 ${
        isDark
          ? "bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800"
          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
      } ${className}`}
      aria-label={isDark ? "Passer en Mode Clair" : "Passer en Mode Sombre"}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            isDark ? "bg-amber-400/15 text-amber-400" : "bg-indigo-50 text-indigo-600"
          }`}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </div>
        <span>{isDark ? "Thème Sombre" : "Thème Clair"}</span>
      </div>
      <span
        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
          isDark ? "bg-slate-800 text-amber-400" : "bg-slate-100 text-slate-600"
        }`}
      >
        {isDark ? "Nuit" : "Jour"}
      </span>
    </button>
  );
}
