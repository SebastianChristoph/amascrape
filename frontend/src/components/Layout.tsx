import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import UserService from "../services/UserService";
import { useState } from "react";
import { AiFillAmazonCircle } from "react-icons/ai";
import { MdLogout } from "react-icons/md";
import { FiSettings } from "react-icons/fi";
import { FaChartLine } from "react-icons/fa";
import {
  IoAddCircleSharp,
  IoPersonCircle,
  IoWalletSharp,
  IoInformationCircle,
} from "react-icons/io5";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { useTheme } from "@mui/material/styles";


export default function Layout({
  setIsAuthenticated,
  setUser,
  mode,
  toggleTheme,
}: {
  setIsAuthenticated: (auth: boolean) => void;
  setUser: (user: any) => void;
  mode: "light" | "dark";
  toggleTheme: () => void;
}) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(UserService.isAuthenticated());
  const [drawerOpen, setDrawerOpen] = useState(true);
  const location = useLocation();
  const user = UserService.getUser();
  const theme = useTheme();

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

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  if (location.pathname === "/") return <Outlet />;

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Sidebar / Drawer */}
      <Box
        sx={{
          width: drawerOpen ? 240 : 72,
          transition: "width 0.3s",
          backgroundColor: "#1E293B",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          py: 3,
          px: 1,
          boxShadow: "2px 0 8px rgba(0,0,0,0.5)",
          overflowX: "hidden",
        }}
      >
        {/* Top: Toggle + Logo + Navigation */}
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: drawerOpen ? "flex-end" : "center",
              px: 1.5,
              mb: 2,
            }}
          >
            <IconButton onClick={toggleDrawer} sx={{ color: "#FFFFFF" }}>
              {drawerOpen ? <BiChevronLeft style={{  color: theme.palette.accent.main }} /> : <BiChevronRight style={{  color: theme.palette.accent.main }} />}
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: drawerOpen ? 1 : 0,
              justifyContent: drawerOpen ? "flex-start" : "center",
              px: 1.5,
              mb: 4,
            }}
          >
            {!drawerOpen && (
              <AiFillAmazonCircle size={20} style={{ minWidth: 24, color: theme.palette.accent.main }} />
            )}
            {drawerOpen && (
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#FFFFFF" }}>
                MarketScope
              </Typography>
            )}
          </Box>

          {isLoggedIn && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Tooltip
                title="Dashboard"
                placement="right"
                disableHoverListener={drawerOpen}
              >
                <Box
                  component={Link}
                  to="/dashboard"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: drawerOpen ? 1.5 : 0,
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    color: "#FFFFFF",
                    textDecoration: "none",
                    justifyContent: drawerOpen ? "flex-start" : "center",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <FaChartLine size={20} style={{ minWidth: 24, color: theme.palette.accent.main }} />
                  {drawerOpen && (
                    <Typography variant="body2" sx={{ color: "#FFFFFF" }}>Dashboard</Typography>
                  )}
                </Box>
              </Tooltip>

              <Tooltip
                title="Add Market Cluster"
                placement="right"
                disableHoverListener={drawerOpen}
              >
                <Box
                  component={Link}
                  to="/add-market-cluster"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: drawerOpen ? 1.5 : 0,
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    color: "#FFFFFF",
                    textDecoration: "none",
                    justifyContent: drawerOpen ? "flex-start" : "center",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <IoAddCircleSharp size={20} style={{ minWidth: 24, color: theme.palette.accent.main }} />
                  {drawerOpen && (
                    <Typography variant="body2" sx={{ color: "#FFFFFF" }}>Add Cluster</Typography>
                  )}
                </Box>
              </Tooltip>

              <Tooltip
                title="Cluster Information"
                placement="right"
                disableHoverListener={drawerOpen}
              >
                <Box
                  component={Link}
                  to="/cluster-info"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: drawerOpen ? 1.5 : 0,
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    color: "#FFFFFF",
                    textDecoration: "none",
                    justifyContent: drawerOpen ? "flex-start" : "center",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <IoInformationCircle size={20} style={{ minWidth: 24, color: theme.palette.accent.main }} />
                  {drawerOpen && (
                    <Typography variant="body2" sx={{ color: "#FFFFFF" }}>Cluster Info</Typography>
                  )}
                </Box>
              </Tooltip>

              <Tooltip
                title="My Wallet"
                placement="right"
                disableHoverListener={drawerOpen}
              >
                <Box
                  component={Link}
                  to="/dashboard"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: drawerOpen ? 1.5 : 0,
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    color: "#FFFFFF",
                    textDecoration: "none",
                    justifyContent: drawerOpen ? "flex-start" : "center",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <IoWalletSharp size={20} style={{ minWidth: 24, color: theme.palette.accent.main }} />
                  {drawerOpen && (
                    <Typography variant="body2" sx={{ color: "#FFFFFF" }}>My Wallet</Typography>
                  )}
                </Box>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Bottom: User Info + Admin + Logout */}
        {isLoggedIn && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: drawerOpen ? 1.5 : 0,
                px: 2,
                justifyContent: drawerOpen ? "flex-start" : "center",
              }}
            >
              <IoPersonCircle size={20} style={{ minWidth: 24, color: theme.palette.accent.main }} />
              {drawerOpen && (
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#FFFFFF" }}>
                    {user?.username}
                  </Typography>
                </Box>
              )}
            </Box>

            {user?.username === "admin" && (
              <Box
                onClick={clickAdminIcon}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: drawerOpen ? 1.5 : 0,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  cursor: "pointer",
                  justifyContent: drawerOpen ? "flex-start" : "center",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <FiSettings size={20} style={{ minWidth: 24, color: theme.palette.accent.main }} />
                {drawerOpen && (
                  <Typography variant="body2" sx={{ color: "#FFFFFF" }}>Admin Panel</Typography>
                )}
              </Box>
            )}

            <Box
              onClick={toggleTheme}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: drawerOpen ? 1.5 : 0,
                px: 2,
                py: 1,
                borderRadius: 2,
                cursor: "pointer",
                justifyContent: drawerOpen ? "flex-start" : "center",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              {mode === "light" ? (
                <MdDarkMode size={20} style={{ minWidth: 24 , color: theme.palette.accent.main}} />
              ) : (
                <MdLightMode size={20} style={{ minWidth: 24, color: theme.palette.accent.main }} />
              )}
              {drawerOpen && (
                <Typography variant="body2" sx={{ color: "#FFFFFF" }}>
                  {mode === "light" ? "Dark Mode" : "Light Mode"}
                </Typography>
              )}
            </Box>

            <Box
              onClick={handleLogout}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: drawerOpen ? 1.5 : 0,
                px: 2,
                py: 1,
                borderRadius: 2,
                cursor: "pointer",
                justifyContent: drawerOpen ? "flex-start" : "center",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <MdLogout size={20} style={{ minWidth: 24, color: theme.palette.accent.main }} />
              {drawerOpen && <Typography variant="body2" sx={{ color: "#FFFFFF" }}>Logout</Typography>}
            </Box>
          </Box>
        )}
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ flexGrow: 1, padding: 8 }}>
          <Outlet />
        </Box>

        {/* Footer */}
        <Box
          sx={{
            textAlign: "center",
            padding: 8,
            paddingLeft: 16,
            backgroundColor: "background.default",
          }}
        >
          <Typography variant="body2">
            © {new Date().getFullYear()} MarketScope
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
