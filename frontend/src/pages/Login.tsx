import { useState } from "react";
import { Container, TextField, Button, Typography, Box, Paper } from "@mui/material";
import { login } from "../api";
import { useTheme } from "@mui/material/styles";

export default function Login() {
  const theme = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(username, password);
      localStorage.setItem("token", data.access_token);
      alert("Login erfolgreich!");
    } catch {
      setError("Login fehlgeschlagen. Bitte überprüfe deine Anmeldedaten.");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          textAlign: "center", 
          backgroundColor: theme.palette.background.default, 
          color: theme.palette.text.primary, 
          width: "100%"
        }}>
        <Typography variant="h4" gutterBottom>
          Login
        </Typography>
        {error && (
          <Typography color="error" sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}
        <Box component="form" onSubmit={handleLogin} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField 
            label="Username" 
            variant="outlined" 
            fullWidth 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField 
            label="Password" 
            type="password" 
            variant="outlined" 
            fullWidth 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
