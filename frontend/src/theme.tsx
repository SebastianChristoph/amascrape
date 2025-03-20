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
      main: "#6E30F2", // Dunkles Violett als Hauptfarbe
      light: "#5F49F2", // Helles Violett
      dark: "#5B28CC" // Dunkleres Violett
    },
    secondary: { 
      main: "#3BD99F", // Mint/Türkis für Akzente
      light: "#50E2AF", // Helleres Mint
      dark: "#2FB585" // Dunkleres Mint
    },
    tertiary: { 
      main: "#4C4D59", // Dunkelgrau als Tertiärfarbe
      light: "#696A77", // Helleres Grau
      dark: "#3C3D47" // Dunkleres Grau
    },
    background: { 
      default: "#F2F2F2", // Helles Grau als Hintergrund
      paper: "#FFFFFF" // Weiß für Karten
    },
    text: { 
      primary: "#4C4D59", // Dunkelgrau für Haupttext
      secondary: "#696A77" // Helleres Grau für sekundären Text
    },
    error: {
      main: "#FF4D4D",
      light: "#FF6666",
      dark: "#CC3D3D"
    },
    success: {
      main: "#3BD99F",
      light: "#50E2AF",
      dark: "#2FB585"
    },
    warning: {
      main: "#FFB84D",
      light: "#FFC266",
      dark: "#CC923D"
    },
    info: {
      main: "#5F49F2",
      light: "#7A67F5",
      dark: "#4C3ACC"
    }
  },
  typography: {
    fontFamily: 'sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#4C4D59", // Dunkelgrau für Überschriften
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#4C4D59",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 500,
      color: "#4C4D59",
    },
    body1: {
      fontSize: "1rem",
      color: "#696A77", // Helleres Grau für Bodytext
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
});

// Dark-Theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { 
      main: '#6E30F2', // Dunkles Violett
      light: '#5F49F2',
      dark: '#5B28CC'
    },
    secondary: { 
      main: '#3BD99F', // Mint/Türkis
      light: '#50E2AF',
      dark: '#2FB585'
    },
    tertiary: { 
      main: '#4C4D59', // Dunkelgrau
      light: '#696A77',
      dark: '#3C3D47'
    },
    background: { 
      default: '#3C3D47', // Dunkleres Grau als Hintergrund
      paper: '#4C4D59' // Dunkelgrau als Kartenhintergrund
    },
    text: { 
      primary: '#F2F2F2', // Helles Grau für Haupttext
      secondary: '#FFFFFF' // Weiß für sekundären Text
    },
    error: {
      main: "#FF4D4D",
      light: "#FF6666",
      dark: "#CC3D3D"
    },
    success: {
      main: "#3BD99F",
      light: "#50E2AF",
      dark: "#2FB585"
    },
    warning: {
      main: "#FFB84D",
      light: "#FFC266",
      dark: "#CC923D"
    },
    info: {
      main: "#5F49F2",
      light: "#7A67F5",
      dark: "#4C3ACC"
    }
  },
  typography: {
    fontFamily: 'sans-serif',
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
