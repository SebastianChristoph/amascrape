import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import { FaLayerGroup, FaDollarSign, FaEdit, FaTrash } from "react-icons/fa";
import { useSnackbar } from "../providers/SnackbarProvider";
import ChartDataService from "../services/ChartDataService";
import MarketService from "../services/MarketService";
import CustomSparkLine from "./charts/CustomSparkLine";

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
        elevation={1}
        sx={{
          cursor: "pointer",
          backgroundColor: 'white',
          borderRadius: 2,
          overflow: "hidden",
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            '& .delete-button': {
              opacity: 1,
              visibility: 'visible',
            },
          },
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3 , minHeight: 350}}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: '12px',
                  backgroundColor: '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FaLayerGroup size={22} color="#1976d2" />
              </Box>
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                {cluster.title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenEditDialog(true);
                }}
                sx={{ color: 'primary.main' }}
              >
                <FaEdit size={20} />
              </IconButton>
              <IconButton
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenConfirmDialog(true);
                }}
                sx={{ 
                  color: 'error.main',
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'opacity 0.2s, visibility 0.2s',
                }}
              >
                <FaTrash size={20} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Included markets:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {Array.isArray(cluster.markets) && cluster.markets.length > 0 ? (
                cluster.markets.map((market, index) => (
                  <Chip 
                    key={index} 
                    label={market} 
                    variant="outlined" 
                    size="small"
                    sx={{ 
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      backgroundColor: '#e3f2fd',
                      '& .MuiChip-label': {
                        fontWeight: 500,
                      }
                    }}
                  />
                ))
              ) : (
                <Chip label="No markets" color="default" size="small" />
              )}
            </Box>
          </Box>

          {totalRevenue === 0 ? (
            <Box sx={{ mt: 2 }}>
              <Alert 
                severity="info" 
                sx={{ 
                  backgroundColor: '#e3f2fd',
                  color: 'primary.main',
                  '& .MuiAlert-icon': {
                    color: 'primary.main'
                  }
                }}
              >
                Markets and Products wait for initial scraping, please come back later or click for a first impression
              </Alert>
              <LinearProgress 
                sx={{ 
                  mt: 2,
                  backgroundColor: '#e3f2fd',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'primary.main'
                  }
                }} 
              />
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 45,
                    height: 45,
                    borderRadius: '12px',
                    backgroundColor: '#e3f2fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FaDollarSign size={22} color="#1976d2" />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(Number(totalRevenue))}
                  </Typography>
                </Box>
              </Box>

              {totalRevenue > 0 && (
                <Box sx={{ mt: 2, height: 50 }}>
                  {loadingSparkline ? (
                    <CircularProgress size={30} sx={{ color: 'primary.main' }} />
                  ) : (
                    <CustomSparkLine data={sparklineData} />
                  )}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

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
