import {
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UserService from "../services/UserService";

export default function LogViewer() {
  const { filename } = useParams<{ filename: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const theme = useTheme();

  useEffect(() => {
    if (!filename) return;

    const fetchContent = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:9000/scraping/logs/${filename}`,
          {
            headers: { Authorization: `Bearer ${UserService.getToken()}` },
          }
        );

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
          elevation={2}
          sx={{
            p: 3,
            maxHeight: "70vh",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            backgroundColor:
              theme.palette.mode === "light"
                ? "#F8FAFC" // Light theme background
                : "#1E293B", // Dark theme background
            color:
              theme.palette.mode === "light"
                ? "#1E293B" // Dark text for light theme
                : "#F8FAFC", // Light text for dark theme
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            "& a": {
              color: theme.palette.primary.main,
              textDecoration: "underline",
              "&:hover": {
                color: theme.palette.primary.dark,
              },
            },
          }}
        >
          <Typography
            component="pre"
            sx={{
              fontFamily: "Consolas, Monaco, monospace",
              fontSize: "0.875rem",
              lineHeight: 1.5,
              margin: 0,
              color: "inherit",
            }}
            dangerouslySetInnerHTML={{
              __html: (content as string).replace(
                /(https?:\/\/[^\s]+)/g,
                (url) =>
                  `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
              ),
            }}
          />
        </Paper>
      )}
    </Container>
  );
}
