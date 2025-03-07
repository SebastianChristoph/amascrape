import { AppBar, Toolbar, Button, Box, Typography, Container } from "@mui/material";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import UserService from "../services/UserService";
import { useSnackbar } from "../providers/SnackbarProvider";
import { useTheme } from "@mui/material/styles";
import { AiFillAmazonCircle } from "react-icons/ai";
import { MdLogout } from "react-icons/md";

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
      <AppBar position="static"  sx={{ backgroundColor: "(theme) => theme.palette.primary.main "}}>
        
          <Toolbar sx={{ display: "flex", justifyContent: "space-between"}}>
            {/* Logo & App Name */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <AiFillAmazonCircle size={40} />
                <Typography variant="h6" sx={{fontWeight: "bold", marginRight: 2 }}>
                 AmaScraper
                </Typography>
                
                {/* Menü (nur für eingeloggte Nutzer) */}
                {isLoggedIn && (
                  <Box sx={{ display: "flex", alignItems: "center",  gap: 2, mt: 0.2 }}>
                <Button color="inherit" component={Link} to="/dashboard">
                      Dashboard
                    </Button>
                    {/* <Button color="inherit" component={Link} to="/dashboard">
                      Navpunkt2
                    </Button> */}
              </Box>
              
                )}
            </Box>

           
            {/* Benutzerinfo & Logout (nur für eingeloggte Nutzer) */}
            {isLoggedIn && (
            <Box sx={{ display: "flex",  alignItems: "center", gap: 4, color: "white"}}>
                <Typography sx={{mt: 0.3  }} color="white" variant="body2">{user?.sub}</Typography>
                <Button color="inherit" onClick={handleLogout}>
                <MdLogout size={25} />
                </Button>
              </Box>
            )}
          </Toolbar>
       
      </AppBar>

      {/* 🔹 Seiteninhalt */}
      <div className="main-content">
        <Outlet />
      </div>

      {/* 🔹 Footer */}
      <Box sx={{ textAlign: "center", padding: 2, backgroundColor: "#f5f5f5" }}>
        <Typography variant="body2">© {new Date().getFullYear()} My WebApp</Typography>
      </Box>
    </>
  );
}
