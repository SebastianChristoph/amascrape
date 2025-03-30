import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Layout from "./components/Layout";
import AddMarketCluster from "./pages/AddMarketCluster";
import ClusterDetails from "./pages/ClusterDetails";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { SnackbarProvider } from "./providers/SnackbarProvider";
import UserService from "./services/UserService";
import { lightTheme, darkTheme } from "./theme";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import LogViewer from "./pages/LogViewer";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(UserService.isAuthenticated());
  const [user, setUser] = useState(UserService.getUser());

    // Theme Mode
    const [mode, setMode] = useState<"light" | "dark">(() => {
      return (localStorage.getItem("themeMode") as "light" | "dark") || "dark";
    });
  
    const toggleTheme = () => {
      const newMode = mode === "light" ? "dark" : "light";
      setMode(newMode);
      localStorage.setItem("themeMode", newMode);
    };

  useEffect(() => {
    setIsAuthenticated(UserService.isAuthenticated());
    setUser(UserService.getUser());
  }, []);

  return (
    <ThemeProvider theme={mode === "light" ? lightTheme : darkTheme}>
      <CssBaseline />
      <SnackbarProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
            />
            <Route path="/register" element={<Register />} />

            {/* ✨ Theme-Controls werden an Layout weitergereicht */}
            <Route
              element={
                <Layout
                  setIsAuthenticated={setIsAuthenticated}
                  setUser={setUser}
                  mode={mode}
                  toggleTheme={toggleTheme}
                />
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cluster/:clusterId" element={<ClusterDetails />} />
              <Route path="/add-market-cluster" element={<AddMarketCluster />} />
              <Route path="/admin/logs/:filename" element={<LogViewer />} />
              <Route
                path="/admin"
                element={user?.username === "admin" ? <Admin /> : <Navigate to="/dashboard" />}
              />
            </Route>

            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />} />
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
