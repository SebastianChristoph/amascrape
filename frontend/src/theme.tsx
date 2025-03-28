// src/theme.ts
import { createTheme } from '@mui/material/styles';

// Erweiterung der Palette (siehe oben)
declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
    }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
  }
}

// Light-Theme
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1470CC" }, // Seriöses Blau
    secondary: { main: "#017D7B" }, // Professionelles Orange für Akzente
    accent: { main: "#455A64" }, // Dezentes Grau-Blau für zusätzliche Elemente
    background: { default: "#F5F5F5", paper: "#FFFFFF" }, // Helles Grau & Weiß für Professionalität
    text: { primary: "#212121", secondary: "#757575" }, // Dunkles Grau für Lesbarkeit
  },
  typography: {
    fontFamily: 'sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#FFFFFF",
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
    primary: { main: "#6C72FF" },  // mattes lila
    secondary: { main: "#57C3FF" },  // leichtes hellblau
    accent: { main: "#D16109" }, // 
    background: { default: "#080F25", paper: "#101935" }, // Paper dunkles blau
    text: { primary: "#AEB9E1", secondary: "#FFFFFF" }, // leichtes lila / weiß
  },
  typography: {
    fontFamily: 'sans-serif',
    h1: {
      fontSize: "1.8rem",
      fontWeight: 700,
      color: "#FFFFFF",
    },
    h2: {
      fontSize: "1.6rem",
      fontWeight: 600,
      // color: "#212121",
    },
    h3: {
      fontSize: "1.4rem",
      fontWeight: 500,
      // color: "#212121",
    },
    body1: {
      fontSize: "1rem",
      // color: "#424242", // Dunkleres Grau für normalen Text
    },
    button: {
      textTransform: "none", // Verhindert Großbuchstaben in Buttons
      fontWeight: 600,
    },
  },
});
