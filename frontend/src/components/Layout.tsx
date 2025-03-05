import { AppBar, Toolbar, Button, Box, Typography, Container } from "@mui/material";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import UserService from "../services/UserService";
import { useSnackbar } from "../providers/SnackbarProvider";

export default function Layout() {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar(); // Snackbar Hook nutzen
  const location = useLocation();
  const isLoggedIn = UserService.isAuthenticated();
  const user = UserService.getUser();

  const handleLogout = () => {
      UserService.logout();
      showSnackbar("Logout erfolgreich! Delete JWT", "success");
      localStorage.removeItem("token");
    navigate("/");
  };

  // Kein Layout auf der Login-Seite
  if (location.pathname === "/") return <Outlet />;

  return (
    <>
      {/* 🔹 Navbar */}
      <AppBar position="static" color="primary">
        <Container>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            {/* Logo & App Name */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", marginRight: 2 }}>
                🌍 My WebApp
              </Typography>
            </Box>

            {/* Menü (nur für eingeloggte Nutzer) */}
            {isLoggedIn && (
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button color="inherit" component={Link} to="/dashboard">
                  Navpunkt1
                </Button>
                <Button color="inherit" component={Link} to="/dashboard">
                  Navpunkt2
                </Button>
              </Box>
            )}

            {/* Benutzerinfo & Logout (nur für eingeloggte Nutzer) */}
            {isLoggedIn && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="body1">👤 {user?.sub}</Typography>
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* 🔹 Seiteninhalt */}
      <Container sx={{ minHeight: "80vh", paddingY: 4 }}>
        <Outlet />
      </Container>

      {/* 🔹 Footer */}
      <Box sx={{ textAlign: "center", padding: 2, backgroundColor: "#f5f5f5" }}>
        <Typography variant="body2">© {new Date().getFullYear()} My WebApp</Typography>
      </Box>
    </>
  );
}
