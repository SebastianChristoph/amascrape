import {
  Alert,
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
  LinearProgress,
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
  fetchMarketClusters: () => void;
}

const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  onClick,
  deletingCluster,
  setMarketClusters,
  setDeletingCluster,
  totalRevenue,
  fetchMarketClusters,
}) => {
  const { showSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(cluster.title);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [sparklineData, setSparklineData] = useState<number[]>([]);
  const [loadingSparkline, setLoadingSparkline] = useState<boolean>(true);

  // ✅ Lade Sparkline-Daten nur, wenn `totalRevenue > 0`
  useEffect(() => {
    async function fetchSparklineData() {
      if (totalRevenue > 0) {
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
          setLoadingSparkline(false);
        }
      }
    }
    fetchSparklineData();
  }, [cluster.id, totalRevenue]);

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
              <IconButton color="primary" onClick={(e) => {
                e.stopPropagation();
                setOpenEditDialog(true);
              }}>
                <MdEdit size={24} />
              </IconButton>
              <IconButton color="primary" onClick={(e) => {
                e.stopPropagation();
                setOpenConfirmDialog(true);
              }}>
                <MdDelete size={24} />
              </IconButton>
            </>
          }
        />

        <CardContent sx={{ minHeight: 300 }}>
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

          {/* ✅ Falls `totalRevenue === 0` → Zeige Alert */}
          {totalRevenue === 0 ? (
            <Box>
            <Alert severity="info" sx={{ mt: 4 }}>
              Markets and Products wait for initial scraping, please come back later or click for a first impression
            </Alert>
              <LinearProgress />
              </Box>
          ) : (
            <>
              {/* ✅ Falls Umsatz vorhanden → Zeige Wert + Sparkline */}
              <Typography sx={{ mt: 4 }} variant="h3">
                Total Revenue:{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(Number(totalRevenue))}
              </Typography>

              {/* ✅ Sparkline nur anzeigen, wenn `totalRevenue > 0` */}
              {totalRevenue > 0 && (
                <Box sx={{ mt: 2, width: "50%", height: 50 }}>
                  {loadingSparkline ? (
                    <CircularProgress size={30} color="primary" />
                  ) : (
                    <CustomSparkLine data={sparklineData} />
                  )}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Delete */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Delete Market Cluster</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the market cluster "{cluster.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              setDeletingCluster(cluster.id);
              const success = await MarketService.deleteMarketCluster(cluster.id);
              if (success) {
                showSnackbar("Market Cluster successfully deleted");
                fetchMarketClusters();
              } else {
                showSnackbar("Error deleting Market Cluster", "error");
                setDeletingCluster(null);
              }
              setOpenConfirmDialog(false);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Market Cluster</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Cluster Title"
            type="text"
            fullWidth
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              try {
                await MarketService.updateMarketCluster(cluster.id, { title: newTitle });
                showSnackbar("Market Cluster title updated successfully");
                fetchMarketClusters();
                setOpenEditDialog(false);
              } catch (error) {
                showSnackbar("Error updating Market Cluster title", "error");
              }
            }}
            color="primary"
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default ClusterCard;
