import { Box, Typography, Tooltip, IconButton, Button } from "@mui/material";
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
    <Box sx={{ display: "flex", height: "100vh" }}>
      
      {/* Sidebar */}
      <Box
        sx={{
          width: 200,
          background: "background.primary",
          color: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 2,
          justifyContent: "space-between",
          boxShadow: "1px 0 4px rgba(255, 255, 255, 0.1)",
          zIndex: 1,
        }}
      >
        {/* Top: Logo & App Name */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <AiFillAmazonCircle size={32} />
          <Typography variant="caption" sx={{ fontWeight: "bold", textAlign: "center" }}>
            MarketScope
          </Typography>
        </Box>

        {/* Middle: Navigation */}
        {isLoggedIn && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
            <Tooltip title="Dashboard" placement="right">
              <IconButton component={Link} to="/dashboard" sx={{ color: "white" }}>
                <FaChartLine size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="My Wallet" placement="right">
              <IconButton component={Link} to="/wallet" sx={{ color: "white" }}>
                💰
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Bottom: User Info, Admin, Logout */}
        {isLoggedIn && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
            <Tooltip title={user?.username} placement="right">
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <IoPersonCircle size={22} />
                <Typography variant="caption" sx={{ display: "block", fontSize: "0.65rem" }}>
                  {user?.username}
                </Typography>
              </Box>
            </Tooltip>

            {user?.username === "admin" && (
              <Tooltip title="Admin Panel" placement="right">
                <IconButton onClick={clickAdminIcon} sx={{ color: "white" }}>
                  <FiSettings size={18} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Logout" placement="right">
              <IconButton onClick={handleLogout} sx={{ color: "white" }}>
                <MdLogout size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <Box sx={{ flexGrow: 1, padding: 8 }}>
          <Outlet />
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: "center", padding: 2, backgroundColor: "background.main" }}>
          <Typography variant="body2">© {new Date().getFullYear()} MarketScope</Typography>
        </Box>
      </Box>
    </Box>
  );
}
