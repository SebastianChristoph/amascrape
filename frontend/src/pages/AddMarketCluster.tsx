import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Typography, Box, Chip, Alert } from "@mui/material";
import MarketService from "../services/MarketService";
import { useSnackbar } from "../providers/SnackbarProvider";

const AddMarketCluster: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  
  const [clusterName, setClusterName] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [existingClusters, setExistingClusters] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);

  // ✅ Prüft, ob ein aktiver Scraping-Prozess läuft
  useEffect(() => {
    const checkActiveScraping = async () => {
      try {
        const activeClusters = await MarketService.getActiveScrapingClusters();
        console.log("🔍 Aktive Scraping-Prozesse:", activeClusters);

        setIsScraping(activeClusters.length > 0);
      } catch (error) {
        console.error("Fehler beim Abrufen aktiver Scraping-Prozesse:", error);
      }
    };

    checkActiveScraping();
  }, []);

  // ✅ Lädt existierende Market-Cluster
  useEffect(() => {
    const fetchMarketClusters = async () => {
      try {
        const data = await MarketService.get_market_cluster();
        if (Array.isArray(data)) {
          setExistingClusters(data.map((cluster: any) => cluster.title.toLowerCase()));
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
          🚧 Ein Scraping-Prozess läuft bereits. Warte, bis dieser abgeschlossen ist, bevor du einen neuen Cluster erstellst.
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
              <Chip key={index} label={keyword} onDelete={() => handleRemoveKeyword(keyword)} sx={{ mr: 1 }} />
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
