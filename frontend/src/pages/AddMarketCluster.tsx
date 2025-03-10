import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Typography, Box, Chip, Alert } from "@mui/material";
import MarketService from "../services/MarketService";
import { useSnackbar } from "../providers/SnackbarProvider";

interface AddMarketClusterProps {
  newClusterData: {
    keywords: string[];
    clusterName: string | null;
    loadingScrapingData: boolean;
    scrapingData: any;
  };
  setNewClusterData: React.Dispatch<
    React.SetStateAction<{
      keywords: string[];
      clusterName: string | null;
      loadingScrapingData: boolean;
      scrapingData: any;
    }>
  >;
}

const AddMarketCluster: React.FC<AddMarketClusterProps> = ({ newClusterData, setNewClusterData }) => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [newKeyword, setNewKeyword] = useState("");
  const [existingClusters, setExistingClusters] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false); // ✅ Speichert Scraping-Status

  // ✅ Prüft beim Laden, ob ein Scraping-Prozess läuft
  useEffect(() => {
    const checkActiveScraping = async () => {
      const activeClusters = await MarketService.getActiveScrapingClusters();
      console.log("🔍 Läuft aktuell ein Scraping-Prozess?", activeClusters.length > 0);
      setIsScraping(activeClusters.length > 0);
    };

    checkActiveScraping();
  }, []);

  // ✅ Lädt existierende Market-Cluster
  useEffect(() => {
    const fetchMarketClusters = async () => {
      try {
        const data = await MarketService.get_market_cluster();
        if (data) {
          setExistingClusters(data.map((cluster: any) => cluster.title.toLowerCase())); // ✅ Cluster-Titel in lowercase speichern
        }
      } catch (error) {
        showSnackbar("Fehler beim Laden der Market-Cluster.");
      }
    };

    fetchMarketClusters();
  }, []);

  // ✅ Keyword hinzufügen (immer in lowercase)
  const handleAddKeyword = () => {
    const keywordLower = newKeyword.trim().toLowerCase();
    if (keywordLower && !newClusterData.keywords.includes(keywordLower)) {
      setNewClusterData((prevState) => ({
        ...prevState,
        keywords: [...prevState.keywords, keywordLower],
      }));
      setNewKeyword("");
    }
  };

  // ✅ Keyword entfernen
  const handleRemoveKeyword = (keywordToRemove: string) => {
    setNewClusterData((prevState) => ({
      ...prevState,
      keywords: prevState.keywords.filter((keyword) => keyword !== keywordToRemove),
    }));
  };

  // ✅ Cluster-Titel aktualisieren (nicht lowercase!)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewClusterData((prevState) => ({
      ...prevState,
      clusterName: e.target.value,
    }));
  };

  // ✅ Market Cluster erstellen
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newClusterData.clusterName) {
      showSnackbar("Bitte gib einen Cluster-Titel ein.");
      return;
    }

    const titleLower = newClusterData.clusterName.toLowerCase();

    if (existingClusters.includes(titleLower)) {
      showSnackbar("❌ Ein Market Cluster mit diesem Titel existiert bereits!");
      return;
    }

    if (newClusterData.keywords.length === 0) {
      showSnackbar("❌ Cluster braucht mindestens 1 Keyword");
      return;
    }

    // ✅ Keywords in lowercase umwandeln
    const lowercaseKeywords = newClusterData.keywords.map((kw) => kw.toLowerCase());

    await MarketService.startScrapingProcess({
      ...newClusterData,
      clusterName: newClusterData.clusterName, // ✅ Originaler Clustername (nicht lowercase!)
      keywords: lowercaseKeywords,
    });

    setNewClusterData((prevState) => ({
      ...prevState,
      loadingScrapingData: true,
    }));

    navigate("/dashboard");
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
            value={newClusterData.clusterName || ""}
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
            {newClusterData.keywords.map((keyword, index) => (
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
