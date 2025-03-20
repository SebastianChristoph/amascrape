import { AppBar, Toolbar, Button, Box, Typography, Tooltip, IconButton, Avatar, useTheme } from "@mui/material";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import UserService from "../services/UserService";
import { useState } from "react";
import { AiFillAmazonCircle } from "react-icons/ai";
import { MdLogout } from "react-icons/md";
import { FiSettings } from "react-icons/fi";
import { FaChartLine } from "react-icons/fa";
import { IoPersonCircle } from "react-icons/io5";

export default function Layout({ setIsAuthenticated, setUser }: { setIsAuthenticated: (auth: boolean) => void, setUser: (user: any) => void }) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(UserService.isAuthenticated());
  const location = useLocation();
  const user = UserService.getUser();
  const theme = useTheme();

  const handleLogout = () => {
    UserService.logout();
    setIsLoggedIn(false);
    setIsAuthenticated(false);
    navigate("/");
  };

  // ✅ Diese Funktion wird aufgerufen, wenn auf das Zahnrad geklickt wird
  const clickAdminIcon = () => {
    const updatedUser = UserService.getUser(); // Neuen User holen
    setUser(updatedUser); // In globalen State speichern
    console.log("Aktueller Benutzer nach Update:", updatedUser);

    navigate("/admin"); // Erst nach /admin navigieren
  };

  if (location.pathname === "/") return <Outlet />;

  return (
    <>
      <AppBar 
        position="static" 
        sx={{ 
          background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
          boxShadow: theme.shadows[3],
          borderBottom: `1px solid ${theme.palette.common.white}1A`,
        }}
      >
        <Toolbar 
          sx={{ 
            display: "flex", 
            justifyContent: "space-between",
            minHeight: "64px !important",
            px: { xs: 2, sm: 4 },
          }}
        >
          {/* Logo & App Name */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AiFillAmazonCircle size={32} style={{ color: theme.palette.common.white }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: "bold", 
                color: theme.palette.common.white,
                letterSpacing: 0.5,
                display: { xs: "none", sm: "block" }
              }}
            >
              MarketScope
            </Typography>
            {isLoggedIn && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/dashboard"
                  startIcon={<FaChartLine />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: `${theme.palette.common.white}1A`,
                    }
                  }}
                >
                  Dashboard
                </Button>
              </Box>
            )}
          </Box>

          {/* User Info & Actions */}
          {isLoggedIn && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IoPersonCircle size={24} style={{ color: theme.palette.common.white }} />
                <Typography 
                  sx={{ 
                    color: theme.palette.common.white, 
                    fontWeight: 500,
                    display: { xs: "none", sm: "block" }
                  }} 
                  variant="body2"
                >
                  {user?.username}
                </Typography>
              </Box>

              {user?.username === "admin" && (
                <Tooltip title="Admin Panel">
                  <IconButton
                    color="inherit"
                    onClick={clickAdminIcon}
                    sx={{
                      "&:hover": {
                        backgroundColor: `${theme.palette.common.white}1A`,
                      }
                    }}
                  >
                    <FiSettings size={20} />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Logout">
                <IconButton
                  color="inherit"
                  onClick={handleLogout}
                  sx={{
                    "&:hover": {
                      backgroundColor: `${theme.palette.common.white}1A`,
                    }
                  }}
                >
                  <MdLogout size={20} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <div className="main-content">
        <Outlet />
      </div>

      <Box sx={{ textAlign: "center", padding: 2, backgroundColor: theme.palette.grey[100] }}>
        <Typography variant="body2">© {new Date().getFullYear()} MarketScope</Typography>
      </Box>
    </>
  );
}
