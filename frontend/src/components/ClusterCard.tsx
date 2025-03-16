import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { GrCluster } from "react-icons/gr";
import { MdDelete, MdEdit } from "react-icons/md";
import { useSnackbar } from "../providers/SnackbarProvider";
import ChartDataService from "../services/ChartDataService";
import MarketService from "../services/MarketService";
import CustomSparkLine from "./charts/CustomSparkLine"; // ✅ Importiere Sparkline-Komponente

interface ClusterCardProps {
  cluster: {
    id: number;
    title: string;
    markets: string[];
  };
  onClick: () => void;
  deletingCluster: number | null;
  setMarketClusters: React.Dispatch<React.SetStateAction<any[]>>;
  setDeletingCluster: React.Dispatch<React.SetStateAction<number | null>>;
  totalRevenue: number;
  fetchMarketClusters: () => void; // ✅ Hinzugefügt, um Daten nach Löschung zu aktualisieren
}

const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  onClick,
  deletingCluster,
  setMarketClusters,
  setDeletingCluster,
  totalRevenue,
  fetchMarketClusters, // ✅ Neue Prop für das Aktualisieren der Market-Cluster
}) => {
  const { showSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(cluster.title);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [sparklineData, setSparklineData] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // ✅ Ladezustand für Sparkline

  // ✅ Holt Sparkline-Daten
  useEffect(() => {
    async function fetchSparklineData() {
      try {
        const response = await ChartDataService.GetSparklineForMarketCluster(
          cluster.id
        );
        if (response.length > 0) {
          setSparklineData(response);
          console.log("[CLUSTER CARD] Geladene Sparkline-Daten:", response);
        } else {
          console.error("Keine Sparkline-Daten erhalten.");
          showSnackbar("Fehler beim Laden der Sparkline-Daten.");
        }
      } catch (error) {
        console.error("Fehler beim Abrufen der Sparkline-Daten:", error);
        showSnackbar("Fehler beim Abrufen der Sparkline-Daten.");
      } finally {
        setLoading(false);
      }
    }
    fetchSparklineData();
  }, [cluster.id]);

  // ✅ Bearbeiten-Dialog öffnen
  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenEditDialog(true);
  };

  // ✅ Löschen-Dialog öffnen
  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenConfirmDialog(true);
  };

  // ✅ Market Cluster aktualisieren
  const handleUpdateCluster = async () => {
    const response = await MarketService.updateMarketCluster(cluster.id, {
      title: newTitle,
    });

    if (response.success) {
      setMarketClusters((prevClusters) =>
        prevClusters.map((c) =>
          c.id === cluster.id ? { ...c, title: newTitle } : c
        )
      );
      showSnackbar("Market Cluster erfolgreich aktualisiert.");
      setOpenEditDialog(false);
    } else {
      showSnackbar("Fehler beim Aktualisieren des Market Clusters.", "error");
    }
  };

  // ✅ Market Cluster löschen
  const handleConfirmDelete = async () => {
    setDeletingCluster(cluster.id);

    const success = await MarketService.deleteMarketCluster(cluster.id);
    if (success) {
      showSnackbar("Market Cluster erfolgreich gelöscht.");
      fetchMarketClusters(); // 🚀 Frische Daten nach dem Löschen abrufen
    } else {
      showSnackbar("Fehler beim Löschen des Market Clusters.", "error");
    }

    setDeletingCluster(null);
    setOpenConfirmDialog(false);
  };

  return (
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
        onClick={onClick}
      >
        <CardHeader
          sx={{ alignItems: "flex-start" }}
          avatar={<GrCluster size={28} color="#000010" />}
          title={<Typography variant="h6">{cluster.title}</Typography>}
          action={
            <>
              <IconButton color="primary" onClick={handleEditClick}>
                <MdEdit size={24} />
              </IconButton>
              <IconButton color="primary" onClick={handleDeleteClick}>
                <MdDelete size={24} />
              </IconButton>
            </>
          }
        />

        <CardContent sx={{ minHeight: 200 }}>
          <Typography variant="body2" color="textSecondary">
            Included markets:
          </Typography>

          <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {Array.isArray(cluster.markets) && cluster.markets.length > 0 ? (
              cluster.markets.map((market, index) => (
                <Chip key={index} label={market} variant="outlined" />
              ))
            ) : (
              <Chip label="Keine Märkte" color="default" />
            )}
          </Box>

          <Typography sx={{ mt: 4 }} variant="h3">
            Total Revenue:{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(Number(totalRevenue))}
          </Typography>

          {/* ✅ Zeigt Sparkline Chart */}
          <Box sx={{ mt: 4, width: "50%", height: 50 }}>
            {loading ? (
              <CircularProgress size={40} color="primary" />
            ) : (
              <CustomSparkLine data={sparklineData} />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Dialog für Bearbeiten */}
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

      {/* ✅ Dialog für Löschen */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Market Cluster löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bist du sicher, dass du dieses Market Cluster löschen möchtest?
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
    </motion.div>
  );
};

export default ClusterCard;
