import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSnackbar } from "../providers/SnackbarProvider";
import LoginService from "../services/LoginService";

export default function Login() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await LoginService.authenticate(username, password);
    setLoading(false);

    if (success) {
      navigate("/dashboard");
    } else {
      showSnackbar("Login fehlgeschlagen. Bitte überprüfe deine Anmeldedaten.", "error");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 2 }}>
          <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>
            Login
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <Typography sx={{ mt: 2, textAlign: "center" }}>
            <Link to="/register">Sie wollen sich registrieren?</Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
