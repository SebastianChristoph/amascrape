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

    primary: {
      main: "#1565C0",     // kräftiges Blau für Hauptaktionen
      light: "#5E92F3",    // für Hover-Zustände
      dark: "#003c8f",     // für aktive oder gedrückte Zustände
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: "#00897B",     // Türkisgrün für sekundäre Aktionen
      light: "#4DB6AC",
      dark: "#005B4F",
      contrastText: "#FFFFFF",
    },

    accent: {
      main: "#ff8c1a",     // sanftes Grau-Blau für dekorative Elemente
      light: "#CFD8DC",
      dark: "#455A64",
      contrastText: "#FFFFFF",
    },

    background: {
      default: "#FAFAFA",  // sehr helles Grau für Hauptfläche
      paper: "#ffffff",    // Karten, modale Fenster etc.
    },

    text: {
      primary: "#000000",  // leicht abgeschwächtes Schwarz für Titel, Haupttext
      secondary: "#000000",// etwas helleres Grau für Nebentext
      disabled: "#BDBDBD", // deaktivierter Text
    },

    divider: "#E0E0E0",     // dezente Linien, z.B. bei <Divider />
  },

  typography: {
    fontFamily: "Roboto, sans-serif",

    h1: {
      fontSize: "2.25rem",
      fontWeight: 700,
      color: "#1A1A1A",
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 600,
      color: "#1A1A1A",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 500,
      color: "#212121",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "#424242",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: "#616161",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});


// Dark-Theme

export const darkTheme = createTheme({
  palette: {
    primary: { main: "#6C72FF" },  // mattes lila
    secondary: { main: "#57C3FF" },  // leichtes hellblau
    accent: { main: "#02AFAC" }, // 
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
