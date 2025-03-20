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
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
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
                  startIcon={<FaChartLine style={{ color: theme.palette.secondary.main }} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    color: theme.palette.common.white,
                    "&:hover": {
                      backgroundColor: `${theme.palette.secondary.main}15`,
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
                <IoPersonCircle size={24} style={{ color: theme.palette.secondary.light }} />
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
                    sx={{
                      color: theme.palette.secondary.main,
                      "&:hover": {
                        backgroundColor: `${theme.palette.secondary.main}15`,
                      }
                    }}
                    onClick={clickAdminIcon}
                  >
                    <FiSettings size={20} />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Logout">
                <IconButton
                  sx={{
                    color: theme.palette.secondary.main,
                    "&:hover": {
                      backgroundColor: `${theme.palette.secondary.main}15`,
                    }
                  }}
                  onClick={handleLogout}
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

      <Box 
        sx={{ 
          textAlign: "center", 
          padding: 2, 
          backgroundColor: (theme) => `${theme.palette.primary.main}05`,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          © {new Date().getFullYear()} MarketScope
        </Typography>
      </Box>
    </>
  );
}
