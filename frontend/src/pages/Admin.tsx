import { Container, Typography } from "@mui/material";

export default function Admin() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>
      <Typography variant="body1">
        Willkommen im Admin-Bereich! Hier kannst du administrative Aufgaben ausführen.
      </Typography>
    </Container>
  );
}
