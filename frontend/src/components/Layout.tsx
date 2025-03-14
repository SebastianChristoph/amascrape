import { AppBar, Toolbar, Button, Box, Typography, Tooltip, Avatar } from "@mui/material";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import UserService from "../services/UserService";
import { useState } from "react";
import { AiFillAmazonCircle } from "react-icons/ai";
import { MdLogout } from "react-icons/md";

export default function Layout({ setIsAuthenticated }: { setIsAuthenticated: (auth: boolean) => void }) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(UserService.isAuthenticated());
  const location = useLocation();
  const user = UserService.getUser();

  const handleLogout = () => {
    UserService.logout();
    setIsLoggedIn(false);
    setIsAuthenticated(false); // ✅ Aktualisiert App-weit die Authentifizierung
    navigate("/");
  };

  if (location.pathname === "/") return <Outlet />;

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: "primary.main" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* 🔹 Logo & App Name */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AiFillAmazonCircle size={40} />
            <Typography variant="h6" sx={{ fontWeight: "bold", marginRight: 2 }}>
              AmaScraper
            </Typography>
            {isLoggedIn && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.2 }}>
                <Button color="inherit" component={Link} to="/dashboard">
                  Dashboard
                </Button>
              </Box>
            )}
          </Box>

          {/* 🔹 Benutzerinfo & Logout */}
          {isLoggedIn && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 4, color: "white" }}>
              <Avatar sx={{backgroundColor: "primary.main", boxShadow: 3, fontSize: 16}}>
                AS
              </Avatar>
              <Typography sx={{ mt: 0.3 }} color="white" variant="body2">
                {user?.sub}
              </Typography>
              <Tooltip title="Logout">
              <Button color="inherit" onClick={handleLogout}>
                  <MdLogout size={25} />
                  
              </Button>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <div className="main-content">
        <Outlet />
      </div>

      <Box sx={{ textAlign: "center", padding: 2, backgroundColor: "#f5f5f5" }}>
        <Typography variant="body2">© {new Date().getFullYear()} My WebApp</Typography>
      </Box>
    </>
  );
}
