import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSnackbar } from "../providers/SnackbarProvider";
import { AiFillAmazonCircle, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaSignInAlt } from "react-icons/fa";
import LoginService from "../services/LoginService";

// SVG Pattern as Base64 to avoid external file dependencies
const backgroundPattern = `data:image/svg+xml;base64,${btoa(`
  <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="gridPattern" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(33, 150, 243, 0.15)" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="2" fill="rgba(33, 150, 243, 0.15)"/>
        <circle cx="50" cy="0" r="2" fill="rgba(33, 150, 243, 0.15)"/>
        <circle cx="0" cy="50" r="2" fill="rgba(33, 150, 243, 0.15)"/>
        <circle cx="25" cy="25" r="1.5" fill="rgba(33, 150, 243, 0.15)"/>
      </pattern>
    </defs>
    <rect width="50" height="50" fill="url(#gridPattern)"/>
  </svg>
`)}`;

export default function Login() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const location = useLocation();
  const [username, setUsername] = useState(location.state?.username || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await LoginService.authenticate(username, password);
    setLoading(false);

    if (success) {
      navigate("/dashboard");
    } else {
      showSnackbar("Login failed. Please check your credentials.", "error");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f8f9fa",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-50%",
          left: "-50%",
          right: "-50%",
          bottom: "-50%",
          backgroundImage: `url("${backgroundPattern}")`,
          backgroundRepeat: "repeat",
          opacity: 0.8,
          transform: "rotate(-10deg) scale(1.2)",
          animation: "moveBackground 120s linear infinite",
          filter: "contrast(110%)",
        },
        "@keyframes moveBackground": {
          "0%": {
            transform: "rotate(-10deg) scale(1.2) translateY(0)",
          },
          "100%": {
            transform: "rotate(-10deg) scale(1.2) translateY(-25%)",
          },
        },
      }}
    >
      <Container maxWidth="lg" sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Paper
          elevation={6}
          sx={{
            width: "900px",
            height: "500px",
            display: "flex",
            borderRadius: 3,
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          {/* Left half: Blue box with title */}
          <Box
            sx={{
              width: "50%",
              backgroundColor: "#0096FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
            }}
          >
            <Box sx={{ mt: 0.5 }}>
              <AiFillAmazonCircle size={40} color="white" />
            </Box>
            <Typography
              variant="h2"
              sx={{
                color: "white",
                fontWeight: "bold",
                letterSpacing: 1,
              }}
            >
              AmaScraper
            </Typography>
          </Box>

          {/* Right half: Login form */}
          <Box
            sx={{
              width: "50%",
              p: 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h5"
              sx={{ mb: 2, textAlign: "center", fontWeight: "bold", color: "primary.main" }}
            >
              Welcome Back!
            </Typography>
            <Typography variant="body2" sx={{ textAlign: "center", mb: 3, color: "text.secondary" }}>
              Please log in with your credentials to continue.
            </Typography>

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                startIcon={<FaSignInAlt />}
                sx={{
                  height: 50,
                  fontSize: 16,
                  fontWeight: "bold",
                  textTransform: "none",
                  background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
                  boxShadow: "0 3px 5px 2px rgba(33, 150, 243, .3)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #1565c0 30%, #1976d2 90%)",
                  },
                }}
              >
                {loading ? "Logging in..." : "Sign In"}
              </Button>
            </form>

            <Typography sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ textDecoration: "none", color: "#1976d2", fontWeight: "bold" }}>
                Register now
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
