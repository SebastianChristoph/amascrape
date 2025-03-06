import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserService from "../services/UserService";
import MarketService from "../services/MarketService";
import { useSnackbar } from "../providers/SnackbarProvider";
import { Typography, Container, Paper, Box, Card, CardContent, CardHeader, IconButton, Chip, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { startAsinScraping, checkScrapingStatus } from "../services/FirstPageAsinScraperService";
import { GrCluster } from "react-icons/gr";
import { MdAdd, MdDelete } from "react-icons/md";
import { motion } from "framer-motion"; // ✅ Framer Motion für Animation

export default function Dashboard() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [marketClusters, setMarketClusters] = useState<any[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [asins, setAsins] = useState<{ asin: string; title: string; price: number | null; image: string }[]>([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [deletingCluster, setDeletingCluster] = useState<number | null>(null); // ✅ State für Animation

  useEffect(() => {
    if (!UserService.isAuthenticated()) {
      navigate("/"); // Redirect to login
    } else {
      const user = UserService.getUser();
      setUsername(user?.sub || "Unbekannter Benutzer");
    }
  }, [navigate]);

  useEffect(() => {
    async function fetchMarketClusters() {
      const data = await MarketService.get_market_cluster();
      if (data) {
        setMarketClusters(data);
      } else {
        showSnackbar("Fehler beim Laden der Market-Cluster.");
      }
    }
    fetchMarketClusters();
  }, []);

  // 📌 ASIN Scraping-Handler
  const handleSearch = async () => {
    setLoading(true);
    setAsins([]);
    const taskId = await startAsinScraping("creatine");

    const interval = setInterval(async () => {
      const status = await checkScrapingStatus(taskId);
      console.log("📡 API Status:", status);
      if (status.status === "completed") {
        setAsins(status.data.first_page_products);
        setLoading(false);
        clearInterval(interval);
      }
    }, 3000);
  };

  // ✅ Löschen-Dialog öffnen
  const handleDeleteClick = (event: React.MouseEvent, clusterId: number) => {
    event.stopPropagation();
    setSelectedClusterId(clusterId);
    setOpenConfirmDialog(true);
  };

  // ✅ Cluster wirklich löschen mit Animation
  const handleConfirmDelete = async () => {
    if (selectedClusterId === null) return;

    setDeletingCluster(selectedClusterId); // ✅ Startet Animation

    setTimeout(async () => {
      const success = await MarketService.deleteMarketCluster(selectedClusterId);
      if (success) {
        setMarketClusters((prevClusters) => prevClusters.filter((c) => c.id !== selectedClusterId));
        showSnackbar("Market Cluster erfolgreich gelöscht.");
      } else {
        showSnackbar("Fehler beim Löschen des Market Clusters.", "error");
      }
      setDeletingCluster(null);
    }, 500); // ✅ Animation dauert 500ms

    setOpenConfirmDialog(false);
  };

  return (
    <Container maxWidth="xl">
      {/* 📌 My Market Clusters */}
      <Paper sx={{ paddingY: 4, paddingX: 4, mt: 2 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          My Market Clusters
        </Typography>

        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={3}>
            {marketClusters.map((cluster, index) => (
              <Grid key={cluster.id} size={4}>
                {/* 🔥 Framer Motion für Fade-Out Animation */}
                <motion.div
                  initial={{ opacity: 1, scale: 1 }}
                  animate={deletingCluster === cluster.id ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card
                    elevation={5}
                    sx={{ cursor: "pointer", "&:hover": { boxShadow: 6 }, borderRadius: 3, overflow: "hidden" }}
                    onClick={() => navigate(`/cluster/${cluster.id}`)}
                  >
                    {/* 📌 Card Header mit Cluster-Icon */}
                    <CardHeader
                      sx={{ alignItems: "flex-start" }}
                      avatar={<GrCluster size={28} color="#000010" />} // ✅ Icon für Cluster
                      title={
                        <Typography variant="h6">
                          Market Cluster #{index + 1}
                        </Typography>
                      }
                      action={
                        <IconButton color="error" onClick={(event) => handleDeleteClick(event, cluster.id)}>
                          <MdDelete size={24} />
                        </IconButton>
                      }
                    />

                    {/* 📌 Card Body - Enthält die Market Chips */}
                    <CardContent sx={{minHeight: 200}}>
                      <Typography variant="h5" gutterBottom>
                        {cluster.title}
                      </Typography>

                      <Typography variant="body2" color="textSecondary">
                        Included markets:
                      </Typography>

                      <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {Array.isArray(cluster.markets) && cluster.markets.length > 0 ? (
                          cluster.markets.map((market: string, index: number) => (
                            <Chip key={index} label={market} variant="outlined" />
                          ))
                        ) : (
                          <Chip label="Keine Märkte" color="default" />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Button
          sx={{ mt: 2 }}
          variant="contained"
          startIcon={<MdAdd />}
          onClick={() => navigate("/add-market-cluster")}
        >
          Add Market Cluster
        </Button>

        {/* 🔥 Bestätigungsdialog für das Löschen */}
        <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
          <DialogTitle>Market Cluster löschen?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Bist du sicher, dass du dieses Market Cluster löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
              Abbrechen
            </Button>
            <Button onClick={handleConfirmDelete} color="error">
              Löschen
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}
