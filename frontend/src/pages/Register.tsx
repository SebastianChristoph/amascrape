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
  import UserService from "../services/UserService";
  
  export default function Register() {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
  
    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
  
      const success = await UserService.register(username, password);
      setLoading(false);
  
      if (success) {
        showSnackbar("Registrierung erfolgreich. Bitte loggen Sie sich ein.", "success");
        navigate("/"); // Weiterleitung zur Login-Seite
      } else {
        showSnackbar("Registrierung fehlgeschlagen. Benutzername bereits vergeben?", "error");
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
              Registrieren
            </Typography>
            <form onSubmit={handleRegister}>
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
                {loading ? "Registrieren..." : "Registrieren"}
              </Button>
            </form>
            <Typography sx={{ mt: 2, textAlign: "center" }}>
              <Link to="/">Bereits registriert? Hier einloggen</Link>
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }
  