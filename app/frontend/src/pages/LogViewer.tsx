import {
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
  useTheme,
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UserService from "../services/UserService";
import { parseLogContent, getUniqueTypes, filterEntriesByType, isWarningLog, LogEntry, getTypeCount } from "../utils/logUtils";
import Grid from "@mui/material/Grid2";

export default function LogViewer() {
  const { filename } = useParams<{ filename: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
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
        
        if (isWarningLog(filename)) {
          const entries = parseLogContent(text);
          setLogEntries(entries);
          setTypes(getUniqueTypes(entries));
        }
      } catch (error) {
        setContent("❌ Fehler beim Laden der Datei.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [filename]);

  const handleTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: string) => {
    setSelectedType(newType);
  };

  const displayContent = () => {
    if (!content) return "";
    if (!isWarningLog(filename)) return content;

    const filteredEntries = filterEntriesByType(logEntries, selectedType || null);
    return filteredEntries.map(entry => entry.content).join('\n-------------------------------------------\n');
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Button variant="contained" component={Link} to="/admin" sx={{ mb: 2 }}>
        ← Zurück zum Admin-Panel
      </Button>
      <Typography variant="h5" gutterBottom>
        Log-Datei: {filename}
      </Typography>

      {isWarningLog(filename) && !loading && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs:12 }}>
              <ToggleButtonGroup
                value={selectedType}
                exclusive
                onChange={handleTypeChange}
                aria-label="Fehlertyp Filter"
                size="small"
                sx={{
                  mb: 2,
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    px: 2,
                  }
                }}
              >
                <ToggleButton value="" aria-label="alle">
                  Alle Warnungen ({logEntries.length})
                </ToggleButton>
                {types.map((type) => (
                  <ToggleButton key={type} value={type} aria-label={type}>
                    {type} ({getTypeCount(logEntries, type)})
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </Box>
      )}

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
                ? "#F8FAFC"
                : "#1E293B",
            color:
              theme.palette.mode === "light"
                ? "#1E293B"
                : "#F8FAFC",
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
              __html: displayContent().replace(
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
