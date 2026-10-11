'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
}: {
  children: React.ReactNode;
  defaultTheme?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(
    (defaultTheme === 'light' ? 'light' : 'dark') as Theme
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('photoweb_theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      setThemeState(saved);
    } else if (defaultTheme === 'light') {
      setThemeState('light');
    } else {
      setThemeState('dark');
    }
    setMounted(true);
  }, [defaultTheme]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('photoweb_theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
