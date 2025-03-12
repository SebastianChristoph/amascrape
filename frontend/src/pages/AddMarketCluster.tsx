import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../providers/SnackbarProvider";
import MarketService from "../services/MarketService";

const AddMarketCluster: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [clusterName, setClusterName] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [existingClusters, setExistingClusters] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);

  // ✅ Automatisches Fetching für aktive Scraping-Prozesse
  useEffect(() => {
    const fetchActiveScrapingClusters = async () => {
      try {
        const activeCluster = await MarketService.getActiveScrapingCluster(); // Holt den einzelnen aktiven Cluster
        console.log(
          "[AddMarketCluster] Aktiver Scraping-Prozess:",
          activeCluster
        );

        if (activeCluster) {
          setIsScraping(true); // Scraping ist aktiv, weiter fetchen
        } else {
          if (isScraping) {
            showSnackbar("✅ Active cluster available");
          }
          setIsScraping(false); // Kein aktives Scraping mehr → Form anzeigen
        }
      } catch (error) {
        console.error("Fehler beim Abrufen aktiver Scraping-Prozesse:", error);
      }
    };

    fetchActiveScrapingClusters(); // Initiales Laden

    if (isScraping) {
      const interval = setInterval(fetchActiveScrapingClusters, 3000);
      return () => clearInterval(interval); // Cleanup Interval
    }
  }, [isScraping, showSnackbar]);

  // ✅ Lädt existierende Market-Cluster
  useEffect(() => {
    const fetchMarketClusters = async () => {
      try {
        const data = await MarketService.GetMarketClusters();
        if (Array.isArray(data)) {
          setExistingClusters(
            data.map((cluster: any) => cluster.title.toLowerCase())
          );
        }
      } catch (error) {
        console.error("Fehler beim Laden der Market-Cluster:", error);
        showSnackbar("Fehler beim Laden der Market-Cluster.");
      }
    };

    fetchMarketClusters();
  }, []);

  // ✅ Keyword hinzufügen (immer in lowercase)
  const handleAddKeyword = () => {
    const keywordLower = newKeyword.trim().toLowerCase();
    if (keywordLower && !keywords.includes(keywordLower)) {
      setKeywords([...keywords, keywordLower]);
      setNewKeyword("");
    }
  };

  // ✅ Keyword entfernen
  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove));
  };

  // ✅ Cluster-Titel aktualisieren
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClusterName(e.target.value);
  };

  // ✅ Market Cluster erstellen
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!clusterName.trim()) {
      showSnackbar("Bitte gib einen Cluster-Titel ein.");
      return;
    }

    const titleLower = clusterName.trim().toLowerCase();

    if (existingClusters.includes(titleLower)) {
      showSnackbar("❌ Ein Market Cluster mit diesem Titel existiert bereits!");
      return;
    }

    if (keywords.length === 0) {
      showSnackbar("❌ Cluster braucht mindestens 1 Keyword");
      return;
    }

    try {
      await MarketService.startScrapingProcess({
        clusterName: clusterName.trim(),
        keywords: keywords.map((kw) => kw.toLowerCase()),
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Fehler beim Starten des Scraping-Prozesses:", error);
      showSnackbar("❌ Fehler beim Starten des Scraping-Prozesses.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Add Market Cluster
      </Typography>

      {/* ✅ Falls Scraping läuft, zeige eine Warnung an */}
      {isScraping ? (
        <Alert severity="warning">
          🚧 Ein Scraping-Prozess läuft bereits. Warte, bis dieser abgeschlossen
          ist, bevor du einen neuen Cluster erstellst.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Cluster Title"
            variant="outlined"
            value={clusterName}
            onChange={handleTitleChange}
            required
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Market Keyword"
              variant="outlined"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
            />
            <Button onClick={handleAddKeyword} variant="contained">
              Add
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            {keywords.map((keyword, index) => (
              <Chip
                key={index}
                label={keyword}
                onDelete={() => handleRemoveKeyword(keyword)}
                sx={{ mr: 1 }}
              />
            ))}
          </Box>

          <Button type="submit" variant="contained" color="primary" fullWidth>
            Create Market Cluster
          </Button>
        </form>
      )}
    </Container>
  );
};

export default AddMarketCluster;
