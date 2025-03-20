// src/theme.ts
import { createTheme } from '@mui/material/styles';

// Erweiterung der Palette
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
    }
  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
  }
}

// Light-Theme
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { 
      main: "#2563EB", // Kräftiges Blau als Hauptfarbe
      light: "#60A5FA", // Helleres Blau
      dark: "#1D4ED8" // Dunkleres Blau
    },
    secondary: { 
      main: "#F97316", // Lebhaftes Orange für CTAs
      light: "#FB923C", // Helleres Orange
      dark: "#EA580C" // Dunkleres Orange
    },
    tertiary: { 
      main: "#8B5CF6", // Lebendiges Violett für Akzente
      light: "#A78BFA", // Helleres Violett
      dark: "#7C3AED" // Dunkleres Violett
    },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    text: { primary: "#1E293B", secondary: "#64748B" },
  },
  typography: {
    fontFamily: 'sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#212121",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#212121",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 500,
      color: "#212121",
    },
    body1: {
      fontSize: "1rem",
      color: "#424242", // Dunkleres Grau für normalen Text
    },
    button: {
      textTransform: "none", // Verhindert Großbuchstaben in Buttons
      fontWeight: 600,
    },
  },
});

// Dark-Theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { 
      main: '#3B82F6', // Helleres Blau für dunklen Modus
      light: '#60A5FA',
      dark: '#2563EB'
    },
    secondary: { 
      main: '#F97316', // Beibehaltung des Orange für Konsistenz
      light: '#FB923C',
      dark: '#EA580C'
    },
    tertiary: { 
      main: '#A78BFA', // Helleres Violett für bessere Sichtbarkeit
      light: '#C4B5FD',
      dark: '#8B5CF6'
    },
    background: { default: '#0F172A', paper: '#1E293B' },
    text: { primary: '#F1F5F9', secondary: '#CBD5E1' },
  },
  typography: {
    fontFamily: '"Poppins", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
});
