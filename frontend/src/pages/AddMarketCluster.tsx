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
  const [openDialog, setOpenDialog] = useState<"dynamic" | "static" | "snapshot" | null>(null);

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

  // Prevent card click when clicking details button
  const handleDetailsClick = (
    event: React.MouseEvent,
    type: "dynamic" | "static" | "snapshot"
  ) => {
    event.stopPropagation();
    setOpenDialog(type);
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
  };

  // Dialog content based on type
  const getDialogContent = (type: "dynamic" | "static" | "snapshot") => {
    switch (type) {
      case "dynamic":
        return {
          title: "Dynamic Cluster Details",
          content: (
            <>
              <Typography variant="h6" gutterBottom>Key Features:</Typography>
              <Typography paragraph>
                • Real-time market monitoring and automatic updates
              </Typography>
              <Typography paragraph>
                • Continuous price tracking and competitor analysis
              </Typography>
              <Typography paragraph>
                • Automated trend detection and alerts
              </Typography>
              <Typography paragraph>
                • Historical data collection and pattern analysis
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Best For:</Typography>
              <Typography paragraph>
                • Active market participants needing current data
              </Typography>
              <Typography paragraph>
                • Products with frequent price changes
              </Typography>
              <Typography paragraph>
                • Competitive market segments
              </Typography>
            </>
          ),
        };
      case "static":
        return {
          title: "Static Cluster Details",
          content: (
            <>
              <Typography variant="h6" gutterBottom>Key Features:</Typography>
              <Typography paragraph>
                • Manual update control for data collection
              </Typography>
              <Typography paragraph>
                • Stable market analysis without automatic changes
              </Typography>
              <Typography paragraph>
                • Customizable update schedules
              </Typography>
              <Typography paragraph>
                • Resource-efficient monitoring
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Best For:</Typography>
              <Typography paragraph>
                • Stable markets with infrequent changes
              </Typography>
              <Typography paragraph>
                • Budget-conscious monitoring needs
              </Typography>
              <Typography paragraph>
                • Baseline market research
              </Typography>
            </>
          ),
        };
      case "snapshot":
        return {
          title: "Snapshot Cluster Details",
          content: (
            <>
              <Typography variant="h6" gutterBottom>Key Features:</Typography>
              <Typography paragraph>
                • One-time comprehensive market capture
              </Typography>
              <Typography paragraph>
                • Detailed point-in-time analysis
              </Typography>
              <Typography paragraph>
                • Perfect for market benchmarking
              </Typography>
              <Typography paragraph>
                • Export and report generation
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Best For:</Typography>
              <Typography paragraph>
                • Market entry analysis
              </Typography>
              <Typography paragraph>
                • Competitive benchmarking
              </Typography>
              <Typography paragraph>
                • One-time research needs
              </Typography>
            </>
          ),
        };
    }
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
                    p: 3,
                    backgroundColor: "background.paper",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                  <Grid container spacing={3}>
                    {/* Dynamic Cluster Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper
                        elevation={clusterType === "dynamic" ? 4 : 1}
                        onClick={() => setClusterType("dynamic")}
                        sx={{
                          p: 3,
                          cursor: "pointer",
                          backgroundColor: clusterType === "dynamic" 
                            ? "primary.dark"
                            : "background.paper",
                          border: "1px solid",
                          borderColor: clusterType === "dynamic"
                            ? "secondary.main"
                            : "rgba(255, 255, 255, 0.1)",
                          borderRadius: 2,
                          transition: "all 0.2s ease-in-out",
                          transform: clusterType === "dynamic" ? "scale(1.02)" : "scale(1)",
                          "&:hover": {
                            transform: "scale(1.02)",
                            borderColor: "secondary.main",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: "50%",
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FaBullseye size={30} color={theme.palette.secondary.main} />
                          </Box>
                          <Typography variant="h6" align="center" color={clusterType === "dynamic" ? "white" : "text.primary"}>
                            Dynamic
                          </Typography>
                          <Typography 
                            variant="body2" 
                            align="center"
                            color={clusterType === "dynamic" ? "white" : "text.secondary"}
                          >
                            Real-time market tracking with continuous updates and trend analysis
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => handleDetailsClick(e, "dynamic")}
                            sx={{
                              mt: 1,
                              color: clusterType === "dynamic" ? "white" : "primary",
                              borderColor: clusterType === "dynamic" ? "white" : "primary.main",
                              '&:hover': {
                                borderColor: clusterType === "dynamic" ? "white" : "primary.main",
                                backgroundColor: clusterType === "dynamic" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.04)",
                              },
                            }}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Static Cluster Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper
                        elevation={clusterType === "static" ? 4 : 1}
                        onClick={() => setClusterType("static")}
                        sx={{
                          p: 3,
                          cursor: "pointer",
                          backgroundColor: clusterType === "static" 
                            ? "primary.dark"
                            : "background.paper",
                          border: "1px solid",
                          borderColor: clusterType === "static"
                            ? "secondary.main"
                            : "rgba(255, 255, 255, 0.1)",
                          borderRadius: 2,
                          transition: "all 0.2s ease-in-out",
                          transform: clusterType === "static" ? "scale(1.02)" : "scale(1)",
                          "&:hover": {
                            transform: "scale(1.02)",
                            borderColor: "secondary.main",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: "50%",
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FaCube size={30} color={theme.palette.secondary.main} />
                          </Box>
                          <Typography variant="h6" align="center" color={clusterType === "static" ? "white" : "text.primary"}>
                            Static
                          </Typography>
                          <Typography 
                            variant="body2" 
                            align="center"
                            color={clusterType === "static" ? "white" : "text.secondary"}
                          >
                            Fixed market analysis with manual update control
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => handleDetailsClick(e, "static")}
                            sx={{
                              mt: 1,
                              color: clusterType === "static" ? "white" : "primary",
                              borderColor: clusterType === "static" ? "white" : "primary.main",
                              '&:hover': {
                                borderColor: clusterType === "static" ? "white" : "primary.main",
                                backgroundColor: clusterType === "static" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.04)",
                              },
                            }}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Snapshot Cluster Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Paper
                        elevation={clusterType === "snapshot" ? 4 : 1}
                        onClick={() => setClusterType("snapshot")}
                        sx={{
                          p: 3,
                          cursor: "pointer",
                          backgroundColor: clusterType === "snapshot" 
                            ? "primary.dark"
                            : "background.paper",
                          border: "1px solid",
                          borderColor: clusterType === "snapshot"
                            ? "secondary.main"
                            : "rgba(255, 255, 255, 0.1)",
                          borderRadius: 2,
                          transition: "all 0.2s ease-in-out",
                          transform: clusterType === "snapshot" ? "scale(1.02)" : "scale(1)",
                          "&:hover": {
                            transform: "scale(1.02)",
                            borderColor: "secondary.main",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: "50%",
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FaCamera size={30} color={theme.palette.secondary.main} />
                          </Box>
                          <Typography variant="h6" align="center" color={clusterType === "snapshot" ? "white" : "text.primary"}>
                            Snapshot
                          </Typography>
                          <Typography 
                            variant="body2" 
                            align="center"
                            color={clusterType === "snapshot" ? "white" : "text.secondary"}
                          >
                            One-time market capture for point-in-time analysis
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => handleDetailsClick(e, "snapshot")}
                            sx={{
                              mt: 1,
                              color: clusterType === "snapshot" ? "white" : "primary",
                              borderColor: clusterType === "snapshot" ? "white" : "primary.main",
                              '&:hover': {
                                borderColor: clusterType === "snapshot" ? "white" : "primary.main",
                                backgroundColor: clusterType === "snapshot" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.04)",
                              },
                            }}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mt: 2, textAlign: "center" }}
                  >
                    Cluster type selection is available but functionality is not yet implemented
                  </Typography>
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

      {/* Details Dialog */}
      <Dialog
        open={openDialog !== null}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "background.paper",
            backgroundImage: "none",
          }
        }}
      >
        {openDialog && (
          <>
            <DialogTitle sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
              {getDialogContent(openDialog).title}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              {getDialogContent(openDialog).content}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} variant="contained">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AddMarketCluster;
