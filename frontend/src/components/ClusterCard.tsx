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
import MarketService from "../services/MarketService";
import ChartDataService from "../services/ChartDataservice";
import CustomLineChart from "./charts/CustomLineChart";

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
}

interface LineChartData {
  x_axis: number[];
  series: { name: string; data: number[] }[];
}

const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  onClick,
  deletingCluster,
  setMarketClusters,
  setDeletingCluster,
  totalRevenue,
}) => {
  const { showSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(cluster.title);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [lineChartData, setLineChartData] = useState<LineChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // ✅ Neuer Ladezustand

  // ✅ Chart-Daten laden
  useEffect(() => {
    async function fetchLineChartData() {
      try {
        const response = await ChartDataService.GetLineChartData();
        if (response) {
          setLineChartData(response);
          console.log("[CLUSTER CARD] Geladene Line Chart Daten:", response);
        } else {
          console.error("Keine LineChart-Daten erhalten.");
          showSnackbar("Fehler beim Laden der LineChart Data.");
        }
      } catch (error) {
        console.error("Fehler beim Abrufen der LineChartData:", error);
        showSnackbar("Fehler beim Abrufen der LineChartData.");
      } finally {
        setLoading(false); // ✅ Ladezustand beenden
      }
    }
    fetchLineChartData();
  }, []);

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

    setTimeout(async () => {
      const success = await MarketService.deleteMarketCluster(cluster.id);
      if (success) {
        setMarketClusters((prevClusters) =>
          prevClusters.filter((c) => c.id !== cluster.id)
        );
        showSnackbar("Market Cluster erfolgreich gelöscht.");
      } else {
        showSnackbar("Fehler beim Löschen des Market Clusters.", "error");
      }
      setDeletingCluster(null);
    }, 500);

    setOpenConfirmDialog(false);
  };

  // ✅ Ladeanzeige, falls Daten noch nicht da sind
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <CircularProgress size={60} color="primary" />
      </Box>
    );
  }

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
              <IconButton color="info" onClick={handleDeleteClick}>
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

          {/* ✅ Zeigt entweder das Chart oder einen Spinner */}
          <Box sx={{ mt: 4, width: 400 }}>
            {lineChartData ? (
              <CustomLineChart
                x_axis={lineChartData.x_axis}
                series={lineChartData.series}
              />
            ) : (
              <CircularProgress size={40} color="primary" />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Dialog für Bearbeiten */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Market Cluster bearbeiten</DialogTitle>
        <DialogContent>
          <DialogContentText>Gib einen neuen Namen für das Market Cluster ein.</DialogContentText>
          <TextField fullWidth label="Neuer Name" variant="outlined" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Abbrechen</Button>
          <Button onClick={handleUpdateCluster} color="primary">Speichern</Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default ClusterCard;
