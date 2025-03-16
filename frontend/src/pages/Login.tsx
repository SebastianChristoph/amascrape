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
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useSnackbar } from "../providers/SnackbarProvider";
import { FaSignInAlt } from "react-icons/fa"; // 🔥 Login Icon
import { AiFillAmazonCircle, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"; // 🔥 Password Icons
import { motion } from "framer-motion"; // 🚀 Für Animation
import LoginService
  from "../services/LoginService";
export default function Login() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const [username, setUsername] = useState(location.state?.username || "");

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
    <Container
      maxWidth="lg"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "900px", // 📌 Größe der Box
          height: "500px",
          display: "flex",
          borderRadius: 3,
          overflow: "hidden", // ✅ Verhindert, dass Inhalte überlaufen
        }}
      >
        {/* ✅ Linke Hälfte: Blaue Box mit Titel */}
        <Box
          sx={{
            width: "50%",
            backgroundColor: "#0096FF", // 📌 Blaue Farbe
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{mt: 0.5}}>
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

        {/* ✅ Rechte Hälfte: Login */}
        <Box
          sx={{
            width: "50%",
            p: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "#fff",
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

            {/* ✅ Password field with visibility toggle */}
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
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
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
  );
}
