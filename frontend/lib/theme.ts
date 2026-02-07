'use client';

import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    console.log("Toggling theme. Current theme is:", isDark ? "dark" : "light");
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('hn_theme', newDark ? 'dark' : 'light');
  };

  return { isDark, toggleTheme };
}
