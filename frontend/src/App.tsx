import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lightTheme } from "./theme";
import { SnackbarProvider } from "./providers/SnackbarProvider";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <SnackbarProvider>
        <Router>
          <Routes>
            {/* Login hat kein Layout */}
            <Route path="/" element={<Login />} />
            
            {/* Alle anderen Seiten haben das Layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
