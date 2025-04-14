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
      main: "#2563EB",     // Modern blue - primary brand color
      light: "#60A5FA",    // Lighter blue for hover states
      dark: "#1D4ED8",     // Darker blue for active states
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: "#059669",     // Professional green - for success states
      light: "#34D399",
      dark: "#047857",
      contrastText: "#FFFFFF",
    },

    accent: {
      main: "#F59E0B",     // Warm orange - for highlights and icons
      light: "#FBBF24",
      dark: "#D97706",
      contrastText: "#FFFFFF",
    },

    background: {
      default: "#F8FAFC",  // Very light gray for main background
      paper: "#FFFFFF",    // Pure white for cards and surfaces
    },

    text: {
      primary: "#1E293B",  // Dark slate for primary text
      secondary: "#64748B", // Medium gray for secondary text
      disabled: "#94A3B8", // Light gray for disabled text
    },

    divider: "#E2E8F0",    // Light gray for dividers
  },

  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    
    h1: {
      fontSize: "2.25rem",
      fontWeight: 700,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontSize: "1.875rem",
      fontWeight: 600,
      letterSpacing: "-0.025em",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "-0.025em",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
      letterSpacing: "0.01em",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      letterSpacing: "0.01em",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.025em",
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 16px",
          fontSize: "0.875rem",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1E293B",
          color: "#FFFFFF",
        }
      }
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          body2: 'div',
        },
      },
      styleOverrides: {
        root: {
          '&[class*="MuiTypography-root"]': {
            '&[style*="color: white"]': {
              color: "#FFFFFF !important",
            }
          }
        }
      }
    }
  },
});

// Dark-Theme
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6C72FF" },  // mattes lila
    secondary: { main: "#57C3FF" },  // leichtes hellblau
    accent: { main: "#02AFAC" }, // 
    background: { 
      default: "#080F25", 
      paper: "#101935" 
    },
    text: { 
      primary: "#AEB9E1", 
      secondary: "#ced3e3"  // angepasst für besseren Kontrast
    },
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
    },
    h3: {
      fontSize: "1.4rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiFilledInput-root': {
            backgroundColor: '#080F25',
            '&:hover': {
              backgroundColor: '#080F25',
            },
            '&.Mui-focused': {
              backgroundColor: '#080F25',
            },
          },
        },
      },
    },
  },
});
