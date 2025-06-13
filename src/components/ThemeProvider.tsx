"use client";

import { useEffect } from "react";
import type { Theme } from "@/types";

interface ThemeProviderProps {
  theme?: Theme;
  children: React.ReactNode;
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export default function ThemeProvider({ theme, children }: ThemeProviderProps) {
  useEffect(() => {
    if (theme?.primaryColor) {
      const [h, s, l] = hexToHsl(theme.primaryColor);
      const root = document.documentElement;

      root.style.setProperty("--primary", `${h} ${s}% ${l}%`);
      root.style.setProperty(
        "--primary-foreground",
        l > 50 ? "0 0% 0%" : "0 0% 100%"
      );

      if (theme.secondaryColor) {
        const [h2, s2, l2] = hexToHsl(theme.secondaryColor);
        root.style.setProperty("--secondary", `${h2} ${s2}% ${l2}%`);
        root.style.setProperty(
          "--secondary-foreground",
          l2 > 50 ? "0 0% 0%" : "0 0% 100%"
        );
      }
    }

    return () => {
      // Cleanup: reset to default values when component unmounts
      if (theme?.primaryColor) {
        const root = document.documentElement;
        root.style.removeProperty("--primary");
        root.style.removeProperty("--primary-foreground");
        root.style.removeProperty("--secondary");
        root.style.removeProperty("--secondary-foreground");
      }
    };
  }, [theme]);

  return <>{children}</>;
}
