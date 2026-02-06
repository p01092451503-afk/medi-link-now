import { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Returns the resolved theme ("light" | "dark"), handling "system" correctly.
 * Listens to both the ThemeProvider context and the system preference media query.
 */
export const useResolvedTheme = (): "light" | "dark" => {
  const { theme } = useTheme();

  const getResolved = (): "light" | "dark" => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  };

  const [resolved, setResolved] = useState<"light" | "dark">(getResolved);

  useEffect(() => {
    setResolved(getResolved());

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => setResolved(mq.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return resolved;
};
