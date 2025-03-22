import { AppBar, Toolbar, Button, Box, Typography, Tooltip, IconButton, Avatar } from "@mui/material";
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

  const handleLogout = () => {
    UserService.logout();
    setIsLoggedIn(false);
    setIsAuthenticated(false);
    navigate("/");
  };

  const clickAdminIcon = () => {
    const updatedUser = UserService.getUser();
    setUser(updatedUser); 
    navigate("/admin"); 
  };

  if (location.pathname === "/") return <Outlet />;

  return (
    <>
      <AppBar 
        position="static" 
        sx={{ 
          background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
          boxShadow: "0 3px 5px 2px rgba(33, 150, 243, .3)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
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
            <AiFillAmazonCircle size={32} style={{ color: "white" }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: "bold", 
                color: "white",
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
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
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
                <IoPersonCircle size={24} style={{ color: "white" }} />
                <Typography 
                  sx={{ 
                    color: "white", 
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
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
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
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
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

      <Box sx={{ textAlign: "center", padding: 2, backgroundColor: "#f5f5f5" }}>
        <Typography variant="body2">© {new Date().getFullYear()} MarketScope</Typography>
      </Box>
    </>
  );
}
