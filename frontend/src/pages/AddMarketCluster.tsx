import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdAdd, MdDelete, MdInfo, MdWarningAmber } from "react-icons/md";
import { useSnackbar } from "../providers/SnackbarProvider";
import MarketService from "../services/MarketService";
import {
  commonBackgroundStyle,
  moveBackgroundKeyframes,
} from "../components/BackgroundPattern";
import { useTheme } from "@mui/material/styles";
import Disclaimer from "../components/Disclaimer";
const AddMarketCluster: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [clusterName, setClusterName] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [existingClusters, setExistingClusters] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [clusterType, setClusterType] = useState<
    "dynamic" | "static" | "snapshot"
  >("dynamic"); // 🆕 Cluster-Type

  // Überprüfen, ob der eingegebene Wert eine Liste ist
  const isListInput = newKeyword.includes(",");
  const theme = useTheme();
  // ✅ Automatisches Fetching für aktive Scraping-Prozesse
  useEffect(() => {
    const fetchActiveScrapingClusters = async () => {
      try {
        const activeCluster = await MarketService.getActiveScrapingCluster();
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

  // ✅ Keyword(s) hinzufügen
  const handleAddKeyword = () => {
    let newKeywords = newKeyword
      .split(",")
      .map((kw) => kw.trim().toLowerCase());
    newKeywords = newKeywords.filter((kw) => kw !== ""); // Entferne leere Einträge

    if (newKeywords.length === 0) return;

    // Prüfe, ob bereits zu viele Keywords existieren
    if (keywords.length + newKeywords.length > 5) {
      showSnackbar("❌ Maximal 5 Keywords erlaubt.");
      return;
    }

    // Füge neue Keywords hinzu, falls sie noch nicht existieren
    const uniqueNewKeywords = newKeywords.filter(
      (kw) => !keywords.includes(kw)
    );
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

  // ✅ Cluster-Typ ändern
  const handleClusterTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setClusterType(event.target.value as "dynamic" | "static" | "snapshot");
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
        clusterType: clusterType,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Fehler beim Starten des Scraping-Prozesses:", error);
      showSnackbar("❌ Fehler beim Starten des Scraping-Prozesses.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "background.default",
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: 4 }}>
        <Box>
          <Typography variant="h1">Create New Market Cluster</Typography>
          <Typography variant="body1" color="text.primary" sx={{ mb: 4 }}>
            Define your market cluster* by adding keywords. You can add them one
            by one or use a comma-separated list.
          </Typography>

          {/* ✅ Falls Scraping läuft, zeige eine Warnung an */}
          {isScraping ? (
            <Alert severity="warning" sx={{ mb: 4 }}>
              🚧 Ein Scraping-Prozess läuft bereits. Warte, bis dieser
              abgeschlossen ist, bevor du einen neuen Cluster erstellst.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                {/* Cluster Name Section */}

                <Paper
                  elevation={2}
                  sx={{
                    width: "100%",
                    p: 2,
                    backgroundColor: "background.paper", border: "1px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Cluster Title"
                      variant="filled"
                      value={clusterName}
                      onChange={handleTitleChange}
                      required
                      placeholder="e.g., Electronics Accessories"
                    />
                  </Grid>
                </Paper>

                  {/* 🆕 Cluster Type Selection */}
                  <Paper
                  elevation={2}
                  sx={{
                    width: "100%",
                    p: 2,
                    backgroundColor: "background.paper",  border: "1px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                <Grid size={{ xs: 12 }}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Cluster Type</FormLabel>
                    <RadioGroup
                      row
                      value={clusterType}
                      onChange={handleClusterTypeChange}
                    >
                      <FormControlLabel
                        value="dynamic"
                        control={<Radio />}
                        label="Dynamic"
                      />
                      <FormControlLabel
                        value="static"
                        control={<Radio />}
                        label="Static"
                      />
                      <FormControlLabel
                        value="snapshot"
                        control={<Radio />}
                        label="Snapshot"
                      />
                    </RadioGroup>
                  </FormControl>
                  <Typography variant="body2" color="text.default" gutterBottom>
                    Choseable but no logic implemented yet
                  </Typography>
                </Grid>
</Paper>
                {/* Bulk Input Section */}
                <Grid size={{ xs: 12 }}>
                  <Paper
                    elevation={2}
                    sx={{ p: 2, backgroundColor: "background.paper",  border: "1px solid rgba(255, 255, 255, 0.25)", }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Bulk Add Keywords
                      </Typography>
                      <Tooltip title="Enter multiple keywords separated by commas">
                        <IconButton size="small"  >
                          <MdInfo color={theme.palette.secondary.main}/>
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        fullWidth
                        label="Comma-separated keywords"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="e.g., wireless earbuds, bluetooth headphones, portable speakers"
                        variant="outlined"
                        size="small"
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddKeyword}
                        startIcon={<MdAdd />}
                        disabled={!newKeyword.trim()}
                        sx={{
                          minWidth: "120px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isListInput ? "Add List" : "Add"}
                      </Button>
                    </Box>
                  </Paper>
                </Grid>

                {/* Keywords List */}
                <Grid size={{ xs: 12 }}>
                  <Paper elevation={2} sx={{ p: 2 ,  border: "1px solid rgba(255, 255, 255, 0.25)",}}>
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 2, fontWeight: 500 }}
                    >
                      Added Keywords ({keywords.length}/5)
                    </Typography>
                    {keywords.length === 0 ? (
                      <Alert variant="outlined" severity="warning">
                        No keywords added yet. Add keywords using the form above
                        or use the bulk input option.
                      </Alert>
                    ) : (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {keywords.map((keyword, index) => (
                          <Paper
                            key={index}
                            variant="outlined"
                            sx={{
                              p: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              backgroundColor: "background.paper",
                              color: theme.palette.text.secondary,
                              border: "1px solid rgba(255, 255, 255, 0.25)",
                            }}
                          >
                            <Typography variant="h6">{keyword}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveKeyword(keyword)}
                              sx={{ color: "white" }}
                            >
                              <MdDelete />
                            </IconButton>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Submit Button */}
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => navigate("/dashboard")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={!clusterName.trim() || keywords.length === 0}
                    >
                      Create Market Cluster
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}
        </Box>
      </Container>

      <Disclaimer />
    </Box>
  );
};

export default AddMarketCluster;
