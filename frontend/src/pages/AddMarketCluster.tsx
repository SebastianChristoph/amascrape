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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { FaBullseye, FaCube, FaCamera } from "react-icons/fa";
import ClusterTypeCard from "../components/ClusterTypeCard";
import ClusterTypeDialog from "../components/ClusterTypeDialog";
import { validateAndFormatKeywords } from "../utils/keywordUtils";
import { validateClusterName, validateKeywords } from "../utils/formValidation";
import { CLUSTER_CONSTANTS } from "../utils/constants";

const AddMarketCluster: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();

  const [clusterName, setClusterName] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [existingClusters, setExistingClusters] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [clusterType, setClusterType] = useState<"dynamic" | "static" | "snapshot">("dynamic");
  const [openDialog, setOpenDialog] = useState<"dynamic" | "static" | "snapshot" | null>(null);

  const isListInput = newKeyword.includes(",");

  // ✅ Automatisches Fetching für aktive Scraping-Prozesse
  useEffect(() => {
    const fetchActiveScrapingClusters = async () => {
      try {
        const activeCluster = await MarketService.getActiveScrapingCluster();
        if (activeCluster) {
          setIsScraping(true);
        } else {
          if (isScraping) {
            showSnackbar(CLUSTER_CONSTANTS.MESSAGES.SCRAPING_COMPLETE);
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
    const newKeywords = newKeyword.split(",").map(kw => kw.trim());
    const validationResult = validateAndFormatKeywords(newKeywords, keywords);

    if (!validationResult.isValid) {
      showSnackbar(validationResult.error || "");
      return;
    }

    setKeywords([...keywords, ...validationResult.formattedKeywords]);
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
  const handleClusterTypeChange = (type: "dynamic" | "static" | "snapshot") => {
    setClusterType(type);
  };

  // Prevent card click when clicking details button
  const handleDetailsClick = (event: React.MouseEvent, type: "dynamic" | "static" | "snapshot") => {
    event.stopPropagation();
    setOpenDialog(type);
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
  };

  // ✅ Market Cluster erstellen
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.clear();

    const nameValidation = validateClusterName(clusterName, existingClusters);
    if (!nameValidation.isValid) {
      showSnackbar(nameValidation.error || "");
      return;
    }

    const keywordsValidation = validateKeywords(keywords);
    if (!keywordsValidation.isValid) {
      showSnackbar(keywordsValidation.error || "");
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
          <Typography variant="h1">{CLUSTER_CONSTANTS.TITLES.PAGE}</Typography>
          <Typography variant="body1" color="text.primary" sx={{ mb: 4 }}>
            Define your market cluster* by adding keywords. You can add them one
            by one or use a comma-separated list.
          </Typography>

          {isScraping ? (
            <Alert severity="warning" sx={{ mb: 4 }}>
              {CLUSTER_CONSTANTS.MESSAGES.SCRAPING_ACTIVE}
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
                    backgroundColor: "background.paper",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
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
                      placeholder={CLUSTER_CONSTANTS.PLACEHOLDERS.CLUSTER_TITLE}
                    />
                  </Grid>
                </Paper>

                {/* Cluster Type Selection */}
                <Paper
                  elevation={2}
                  sx={{
                    width: "100%",
                    p: 3,
                    backgroundColor: "background.paper",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <ClusterTypeCard
                        type="dynamic"
                        icon={<FaBullseye size={30} color={theme.palette.secondary.main} />}
                        title="Dynamic"
                        description="Real-time market tracking with continuous updates and trend analysis"
                        isSelected={clusterType === "dynamic"}
                        onClick={() => handleClusterTypeChange("dynamic")}
                        onDetailsClick={(e) => handleDetailsClick(e, "dynamic")}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <ClusterTypeCard
                        type="static"
                        icon={<FaCube size={30} color={theme.palette.secondary.main} />}
                        title="Static"
                        description="Fixed market analysis with manual update control"
                        isSelected={clusterType === "static"}
                        onClick={() => handleClusterTypeChange("static")}
                        onDetailsClick={(e) => handleDetailsClick(e, "static")}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                      <ClusterTypeCard
                        type="snapshot"
                        icon={<FaCamera size={30} color={theme.palette.secondary.main} />}
                        title="Snapshot"
                        description="One-time market capture for point-in-time analysis"
                        isSelected={clusterType === "snapshot"}
                        onClick={() => handleClusterTypeChange("snapshot")}
                        onDetailsClick={(e) => handleDetailsClick(e, "snapshot")}
                      />
                    </Grid>
                  </Grid>

                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mt: 2, textAlign: "center" }}
                  >
                    {CLUSTER_CONSTANTS.MESSAGES.CLUSTER_TYPE_NOT_IMPLEMENTED}
                  </Typography>
                </Paper>

                {/* Bulk Input Section */}
                <Grid size={{ xs: 12 }}>
                  <Paper
                    elevation={2}
                    sx={{ p: 2, backgroundColor: "background.paper", border: "1px solid rgba(255, 255, 255, 0.25)" }}
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
                        {CLUSTER_CONSTANTS.TITLES.BULK_INPUT}
                      </Typography>
                      <Tooltip title="Enter multiple keywords separated by commas">
                        <IconButton size="small">
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
                        placeholder={CLUSTER_CONSTANTS.PLACEHOLDERS.KEYWORDS}
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
                  <Paper elevation={2} sx={{ p: 2, border: "1px solid rgba(255, 255, 255, 0.25)" }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                      {CLUSTER_CONSTANTS.TITLES.KEYWORDS_LIST} ({keywords.length}/{CLUSTER_CONSTANTS.MAX_KEYWORDS})
                    </Typography>
                    {keywords.length === 0 ? (
                      <Alert variant="outlined" severity="warning">
                        {CLUSTER_CONSTANTS.MESSAGES.NO_KEYWORDS}
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
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                    <Button variant="outlined" onClick={() => navigate("/dashboard")}>
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

      <ClusterTypeDialog
        open={openDialog !== null}
        onClose={handleCloseDialog}
        type={openDialog}
      />
    </Box>
  );
};

export default AddMarketCluster;
