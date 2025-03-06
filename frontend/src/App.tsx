import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lightTheme } from "./theme";
import { SnackbarProvider } from "./providers/SnackbarProvider";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClusterDetails from "./pages/ClusterDetails";
import AddMarketCluster from "./pages/AddMarketCluster";
import UserService from "./services/UserService"; // ✅ Prüft Auth-Status

function App() {
  const isAuthenticated = UserService.isAuthenticated(); // ✅ Prüft, ob der Benutzer eingeloggt ist

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <SnackbarProvider>
        <Router>
          <Routes>
            {/* 🔄 Falls eingeloggt → Weiterleitung zum Dashboard */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
            
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cluster/:clusterId" element={<ClusterDetails />} /> 
              <Route path="/add-market-cluster" element={<AddMarketCluster />} />
            </Route>

            {/* 🔄 Fallback: Unbekannte URLs immer zum Dashboard */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />} />
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
