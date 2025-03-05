import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserService from "../services/UserService";
import { Typography, Container } from "@mui/material";

export default function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!UserService.isAuthenticated()) {
      navigate("/"); // Weiterleitung zum Login, falls kein Token vorhanden ist
    } else {
      const user = UserService.getUser();
      setUsername(user?.sub || "Unbekannter Benutzer");
    }
  }, [navigate]);

  return (
    <Container sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <Typography variant="h4">Willkommen, {username}!</Typography>
    </Container>
  );
}
