import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserService from "../services/UserService";
import MarketService from "../services/MarketService";
import { useSnackbar } from "../providers/SnackbarProvider";
import {
  Typography,
  Container,
  Paper,
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { GrCluster } from "react-icons/gr";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";
import { motion } from "framer-motion"; // ✅ Framer Motion für Animation

export default function Dashboard() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [marketClusters, setMarketClusters] = useState<any[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [asins, setAsins] = useState<
    { asin: string; title: string; price: number | null; image: string }[]
  >([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(
    null
  );
  const [selectedClusterTitle, setSelectedClusterTitle] = useState<string>("");
  const [deletingCluster, setDeletingCluster] = useState<number | null>(null); // ✅ State für Animation
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");

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


  // ✅ Bearbeiten-Dialog öffnen
  const handleEditClick = (event: React.MouseEvent, clusterId: number, clusterTitle: string) => {
    event.stopPropagation();
    setSelectedClusterId(clusterId);
    setSelectedClusterTitle(clusterTitle);
    setNewTitle(clusterTitle); // ✅ Alter Titel wird als Default-Wert gesetzt
    setOpenEditDialog(true);
  };

  // ✅ Löschen-Dialog öffnen
  const handleDeleteClick = (event: React.MouseEvent, clusterId: number) => {
    event.stopPropagation();
    setSelectedClusterId(clusterId);
    setOpenConfirmDialog(true);
  };

  // ✅ Market Cluster aktualisieren
  const handleUpdateCluster = async () => {
    if (selectedClusterId === null) return;
  
    const response = await MarketService.updateMarketCluster(selectedClusterId, { title: newTitle });
  
    if (response.success) {
      // ✅ State direkt aktualisieren, um das UI sofort zu reflektieren
      setMarketClusters((prevClusters) =>
        prevClusters.map((c) =>
          c.id === selectedClusterId ? { ...c, title: newTitle } : c // Hier newTitle verwenden!
        )
      );
  
      showSnackbar("Market Cluster erfolgreich aktualisiert.");
      setOpenEditDialog(false);
    } else {
      showSnackbar("Fehler beim Aktualisieren des Market Clusters.", "error");
    }
  };
  

  // ✅ Cluster wirklich löschen mit Animation
  const handleConfirmDelete = async () => {
    if (selectedClusterId === null) return;

    setDeletingCluster(selectedClusterId); // ✅ Startet Animation

    setTimeout(async () => {
      const success =
        await MarketService.deleteMarketCluster(selectedClusterId);
      if (success) {
        setMarketClusters((prevClusters) =>
          prevClusters.filter((c) => c.id !== selectedClusterId)
        );
        showSnackbar("Market Cluster erfolgreich gelöscht.");
      } else {
        showSnackbar("Fehler beim Löschen des Market Clusters.", "error");
      }
      setDeletingCluster(null);
    }, 500); // ✅ Animation dauert 500ms

    setOpenConfirmDialog(false);
  };

  const handleStartSimulateProcess = async (taskId : string) => {
    console.log("Button clicked");
    const response = await MarketService.startSimulatedProcess(taskId);
    if (response.success) {
      console.log(taskId, "✅ Simulated Process started");
      startCheckingSimulatedProcess(taskId)
    }
  }

  const startCheckingSimulatedProcess = (taskId : string) => {
    console.log("Start checking simulated process");
    const interval = setInterval(async () => {
      const status = await MarketService.checkSimulatedProcessStatus(taskId);
      console.log(taskId, status)
      if (status.status ==="done") {
        console.log("✅ Simulated Process finished");
        console.log(status.data);
        clearInterval(interval);
      } else {
        console.log("❌ Simulated Process not finished");
      }
    }, 1000); 
  }


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
                  animate={
                    deletingCluster === cluster.id
                      ? { opacity: 0, scale: 0.8 }
                      : { opacity: 1, scale: 1 }
                  }
                  transition={{ duration: 0.5 }}
                >
                  <Card
                    elevation={5}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { boxShadow: 6 },
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
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
                        <>
                          <IconButton
                            color="primary"
                            onClick={(event) =>
                              handleEditClick(event, cluster.id, cluster.title)
                            }
                          >
                            <MdEdit size={24} />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={(event) =>
                              handleDeleteClick(event, cluster.id)
                            }
                          >
                            <MdDelete size={24} />
                          </IconButton>
                        </>
                      }
                    />

                    {/* 📌 Card Body - Enthält die Market Chips */}
                    <CardContent sx={{ minHeight: 200 }}>
                      <Typography variant="h5" gutterBottom>
                        {cluster.title}
                      </Typography>

                      <Typography variant="body2" color="textSecondary">
                        Included markets:
                      </Typography>

                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {Array.isArray(cluster.markets) &&
                        cluster.markets.length > 0 ? (
                          cluster.markets.map(
                            (market: string, index: number) => (
                              <Chip
                                key={index}
                                label={market}
                                variant="outlined"
                              />
                            )
                          )
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


        <Button
          sx={{ mt: 2 }}
          variant="contained"
          startIcon={<MdAdd />}
          onClick={() => handleStartSimulateProcess("99")}
        >
          Start Simulated Process 99
        </Button>

        <Button
          sx={{ mt: 2 }}
          variant="contained"
          startIcon={<MdAdd />}
          onClick={() => handleStartSimulateProcess("111")}
        >
          Start Simulated Process 111
        </Button>



        {/* 🔥 Bestätigungsdialog für das Löschen */}
        <Dialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
        >
          <DialogTitle>Market Cluster löschen?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Bist du sicher, dass du dieses Market Cluster löschen möchtest?
              Diese Aktion kann nicht rückgängig gemacht werden.
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

        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
          <DialogTitle>Market Cluster bearbeiten</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Gib einen neuen Namen für das Market Cluster ein.
            </DialogContentText>
            <TextField
  fullWidth
  label="Neuer Name"
  variant="outlined"
  value={newTitle}
  onChange={(e) => setNewTitle(e.target.value)}
  sx={{ mt: 2 }}
/>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Abbrechen</Button>
            <Button onClick={handleUpdateCluster} color="primary">
              Speichern
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}
