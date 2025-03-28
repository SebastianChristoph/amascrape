import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import UserService from "../services/UserService";
import { useState } from "react";
import { AiFillAmazonCircle } from "react-icons/ai";
import { MdLogout } from "react-icons/md";
import { FiSettings } from "react-icons/fi";
import { FaChartLine } from "react-icons/fa";
import { IoAddCircleSharp, IoPersonCircle, IoWalletSharp } from "react-icons/io5";
import { IoAdd } from "react-icons/io5";
export default function Layout({
  setIsAuthenticated,
  setUser,
}: {
  setIsAuthenticated: (auth: boolean) => void;
  setUser: (user: any) => void;
}) {
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
          width: 240,
          backgroundColor: "#0b122b",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          py: 3,
          px: 2,
          boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
        }}
      >
        {/* Top: Logo & Navigation */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, mb: 4 }}>
            <AiFillAmazonCircle size={24} />
            <Typography variant="h6" fontWeight="bold">
              MarketScope
            </Typography>
          </Box>

          {isLoggedIn && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Tooltip title="Dashboard" placement="right">
                <Box
                  component={Link}
                  to="/dashboard"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    color: "white",
                    textDecoration: "none",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  <FaChartLine size={18} />
                  <Typography variant="body2">Dashboard</Typography>
                </Box>
              </Tooltip>

              

              <Tooltip title="Add Market Cluster" placement="right">
                <Box
                  component={Link}
                  to="/add-market-cluster"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    color: "white",
                    textDecoration: "none",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                     <IoAddCircleSharp   size={18} />
                  <Typography variant="body2">Add Cluster</Typography>
                </Box>
              </Tooltip>

              <Tooltip title="My Wallet" placement="right">
                <Box
                  component={Link}
                  to="/dashboard"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    color: "white",
                    textDecoration: "none",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                     <IoWalletSharp  size={18} />
                  <Typography variant="body2">My Wallet</Typography>
                </Box>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Bottom: User Info, Admin, Logout */}
        {isLoggedIn && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
              }}
            >
              <IoPersonCircle size={22} />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {user?.username}
                </Typography>
              
              </Box>
            </Box>

            {user?.username === "admin" && (
              <Box
                onClick={clickAdminIcon}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                  },
                }}
              >
                <FiSettings size={18} />
                <Typography variant="body2">Admin Panel</Typography>
              </Box>
            )}

            <Box
              onClick={handleLogout}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1,
                borderRadius: 2,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                },
              }}
            >
              <MdLogout size={20} />
              <Typography variant="body2">Logout</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <Box sx={{ flexGrow: 1, padding: 8 }}>
          <Outlet />
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: "center",padding: 8, paddingLeft: 16, backgroundColor: "background.default" }}>
          <Typography variant="body2">© {new Date().getFullYear()} MarketScope</Typography>
        </Box>
      </Box>
    </Box>
  );
}
