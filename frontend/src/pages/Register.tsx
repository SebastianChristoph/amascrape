import {
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    Snackbar,
  } from "@mui/material";
  import { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { useSnackbar } from "../providers/SnackbarProvider";
  import VerifyService from "../services/VerifyService";
import UserService from "../services/UserService";
  
  export default function Register() {
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [loading, setLoading] = useState(false);
    const [mockedLink, setMockedLink] = useState<string | null>(null);
  
    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
  
      const response = await UserService.register(username, email, password, passwordRepeat);
  
      setLoading(false);
  
      if (response.success) {
        showSnackbar("✅ E-Mail gesendet! Link hier klicken.");
        setMockedLink(response.mocked_verification_link || ""); // ✅ Falls null, wird "" gesetzt
      } else {
        showSnackbar(response.message, "error");
      }
    };
  
    // ✅ NEUE FUNKTION: Klick auf Mock-Link → Verifizierung ausführen
    const handleVerification = async () => {
      if (!mockedLink) return;
  
      // Extrahiere das Token aus dem Mock-Link (letzter Teil der URL)
      const token = mockedLink.split("/").pop();
      if (!token) return;
  
      const verifyResponse = await VerifyService.verifyUser(token);
  
      if (verifyResponse.success) {
        showSnackbar(`✅ Nutzer ${verifyResponse.username} (${verifyResponse.email}) wurde angelegt.`);
  
        // ✅ Speichere den Nutzername für das Login-Feld & navigiere zur Login-Seite
        navigate("/login", { state: { username: verifyResponse.username } });
      } else {
        showSnackbar(verifyResponse.message, "error");
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
                label="E-Mail"
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Passwort"
                variant="outlined"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Passwort wiederholen"
                variant="outlined"
                type="password"
                value={passwordRepeat}
                onChange={(e) => setPasswordRepeat(e.target.value)}
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
                {loading ? "Registriere..." : "Registrieren"}
              </Button>
            </form>
          </Paper>
  
          {/* ✅ Mocked Verifikations-Link */}
          {mockedLink && (
            <Typography
              sx={{ mt: 2, color: "blue", cursor: "pointer" }}
              onClick={handleVerification} // ✅ Klick auf Link → Verifizierung starten
            >
              Klicke hier, um dein Konto zu aktivieren
            </Typography>
          )}
        </Box>
      </Container>
    );
  }
  