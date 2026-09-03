import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext(null);

export const LIGHT_THEME = {
  mode: 'light',
  background: '#d8cedd',
  card: '#FFFFFF',
  panel: '#FBFAF6',
  text: '#1A1A1A',
  secondaryText: '#6B6B6B',
  border: '#E7E3D9',
  purple: '#6C5CE7',
  purpleLight: '#EEEAFE',
  red: '#C1443A',
  redLight: '#FBEAE8',
  green: '#3E8E5A',
  greenLight: '#E9F5EC',
  input: '#FFFFFF',
};

export const DARK_THEME = {
  mode: 'dark',
  background: '#121116',
  card: '#1C1A22',
  panel: '#24212C',
  text: '#F7F5FA',
  secondaryText: '#AAA5B5',
  border: '#35313F',
  purple: '#7C6CF2',
  purpleLight: '#302A50',
  red: '#EF6A60',
  redLight: '#3B2423',
  green: '#62B77D',
  greenLight: '#203A29',
  input: '#24212C',
};

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();

  const [themeMode, setThemeMode] = useState('system');

  const theme = useMemo(() => {
    const actualMode =
      themeMode === 'system'
        ? systemScheme || 'light'
        : themeMode;

    return actualMode === 'dark' ? DARK_THEME : LIGHT_THEME;
  }, [themeMode, systemScheme]);

  const value = {
    theme,
    themeMode,
    setThemeMode,
    isDark: theme.mode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}