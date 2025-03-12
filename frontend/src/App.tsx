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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    UserService.isAuthenticated()
  );

  useEffect(() => {
    setIsAuthenticated(UserService.isAuthenticated());
  }, []);

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <SnackbarProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
              }
            />
            <Route element={<Layout setIsAuthenticated={setIsAuthenticated} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cluster/:clusterId" element={<ClusterDetails />} />
              <Route
                path="/add-market-cluster"
                element={<AddMarketCluster />}
              />
            </Route>
            <Route
              path="*"
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />}
            />
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
