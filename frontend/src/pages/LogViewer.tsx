import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Container, Typography, Paper, CircularProgress, Button } from "@mui/material";
import { Link } from "react-router-dom";
import UserService from "../services/UserService";

export default function LogViewer() {
  const { filename } = useParams<{ filename: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!filename) return;

    const fetchContent = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:9000/scraping/logs/${filename}`, {
            headers: { Authorization: `Bearer ${UserService.getToken()}` },
          });
          
        const text = await res.text();
        setContent(text);
      } catch (error) {
        setContent("❌ Fehler beim Laden der Datei.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [filename]);

  return (
    <Container sx={{ mt: 4 }}>
      <Button variant="contained" component={Link} to="/admin" sx={{ mb: 2 }}>
        ← Zurück zum Admin-Panel
      </Button>
      <Typography variant="h5" gutterBottom>
        Log-Datei: {filename}
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Paper
          sx={{
            p: 2,
            maxHeight: "70vh",
            overflow: "auto",
            whiteSpace: "pre-wrap",
              backgroundColor: "background",
              color: "white",
              "& a": {
                color: "white",
                textDecoration: "underline", // optional
              },
          }}
        >
          <Typography
  variant="body2"
  dangerouslySetInnerHTML={{
    __html: (content as string).replace(
      /(https?:\/\/[^\s]+)/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    ),
  }}
/>
        </Paper>
      )}
    </Container>
  );
}
