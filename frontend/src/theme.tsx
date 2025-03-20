// src/theme.ts
import { createTheme } from '@mui/material/styles';

// Erweiterung der Palette (siehe oben)
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
      main: "#1470CC",
      light: "#4791db",
      dark: "#0d47a1"
    },
    secondary: { 
      main: "#017D7B",
      light: "#34a09e",
      dark: "#005755"
    },
    tertiary: { 
      main: "#455A64",
      light: "#718792",
      dark: "#1c313a"
    },
    background: { default: "#F5F5F5", paper: "#FFFFFF" }, // Helles Grau & Weiß für Professionalität
    text: { primary: "#212121", secondary: "#757575" }, // Dunkles Grau für Lesbarkeit
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
      main: '#66B6F7',
      light: '#90caf9',
      dark: '#42a5f5'
    },
    secondary: { 
      main: '#FB958D',
      light: '#ffb4ae',
      dark: '#c7766f'
    },
    tertiary: { 
      main: '#ff4081',
      light: '#ff79b0',
      dark: '#c60055'
    },
    background: { default: '#2e2e2e', paper: '#1e1e1e' },
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
