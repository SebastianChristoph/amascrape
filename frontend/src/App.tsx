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
import { lightTheme } from "./theme";
import Register from "./pages/Register";
import Admin from "./pages/Admin"; // ✅ Import der Admin-Seite

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(UserService.isAuthenticated());
  const [user, setUser] = useState(UserService.getUser()); // 🔹 User in State speichern

  useEffect(() => {
    setIsAuthenticated(UserService.isAuthenticated());
    setUser(UserService.getUser());
    console.log("User aktualisiert:", UserService.getUser()); // 🔹 Hier siehst du, ob der Benutzer korrekt geladen wird
  }, []);

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <SnackbarProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
            />
            <Route path="/register" element={<Register />} />

            <Route element={<Layout setIsAuthenticated={setIsAuthenticated} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cluster/:clusterId" element={<ClusterDetails />} />
              <Route path="/add-market-cluster" element={<AddMarketCluster />} />
              
              {/* ✅ Geschützte Admin-Route */}
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
