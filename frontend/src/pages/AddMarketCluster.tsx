import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
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

  // Überprüfen, ob der eingegebene Wert eine Liste ist
  const isListInput = newKeyword.includes(",");

  // ✅ Automatisches Fetching für aktive Scraping-Prozesse
  useEffect(() => {
    const fetchActiveScrapingClusters = async () => {
      try {
        const activeCluster = await MarketService.getActiveScrapingCluster();
        console.log("[AddMarketCluster] Aktiver Scraping-Prozess:", activeCluster);

        if (activeCluster) {
          setIsScraping(true);
        } else {
          if (isScraping) {
            showSnackbar("✅ Active cluster available");
          }
          setIsScraping(false);
        }
      } catch (error) {
        console.error("Fehler beim Abrufen aktiver Scraping-Prozesse:", error);
      }
    };

    fetchActiveScrapingClusters();

    if (isScraping) {
      const interval = setInterval(fetchActiveScrapingClusters, 3000);
      return () => clearInterval(interval);
    }
  }, [isScraping, showSnackbar]);

  // ✅ Lädt existierende Market-Cluster
  useEffect(() => {
    const fetchMarketClusters = async () => {
      try {
        const data = await MarketService.GetMarketClusters();
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

  // ✅ Keyword(s) hinzufügen
  const handleAddKeyword = () => {
    let newKeywords = newKeyword.split(",").map((kw) => kw.trim().toLowerCase());
    newKeywords = newKeywords.filter((kw) => kw !== ""); // Entferne leere Einträge

    if (newKeywords.length === 0) return;

    // Prüfe, ob bereits zu viele Keywords existieren
    if (keywords.length + newKeywords.length > 5) {
      showSnackbar("❌ Maximal 5 Keywords erlaubt.");
      return;
    }

    // Füge neue Keywords hinzu, falls sie noch nicht existieren
    const uniqueNewKeywords = newKeywords.filter((kw) => !keywords.includes(kw));
    setKeywords([...keywords, ...uniqueNewKeywords]);
    setNewKeyword("");
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
    console.clear();

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
        keywords: keywords,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Fehler beim Starten des Scraping-Prozesses:", error);
      showSnackbar("❌ Fehler beim Starten des Scraping-Prozesses.");
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={6} sx={{ p: 4 }}>
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

            <Typography sx={{ mt: 2, mb: 2 }}>
              Add up to five keywords for your cluster. Each keyword acts as a market in your cluster. Our robots will get all the products for this searchterm on Amazon.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Market Keyword(s)"
                variant="outlined"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
              <Button onClick={handleAddKeyword} variant="contained">
                {isListInput ? "Add List" : "Add"}
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
      </Paper>
    </Container>
  );
};

export default AddMarketCluster;
