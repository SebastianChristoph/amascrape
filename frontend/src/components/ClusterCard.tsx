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
  is_initial_scraped: boolean;
}

const ClusterCard: React.FC<ClusterCardProps> = ({
  cluster,
  onClick,
  deletingCluster,
  setMarketClusters,
  setDeletingCluster,
  totalRevenue,
  fetchMarketClusters,
  is_initial_scraped
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
          backgroundColor: 'background.paper',
          borderRadius: 2,
          overflow: "hidden",
          transition: 'transform 0.2s, box-shadow 0.2s',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: (theme) => `0 8px 24px ${theme.palette.primary.main}15`,
            '& .delete-button': {
              opacity: 1,
              visibility: 'visible',
            },
          },
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3, minHeight: 350 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: '12px',
                  backgroundColor: (theme) => `${theme.palette.primary.main}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FaLayerGroup size={22} style={{ color: 'primary.main' }} />
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
                sx={{ 
                  color: 'secondary.main',
                  '&:hover': {
                    backgroundColor: (theme) => `${theme.palette.secondary.main}15`,
                  }
                }}
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
                  '&:hover': {
                    backgroundColor: (theme) => `${theme.palette.error.main}15`,
                  }
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
                      borderColor: 'secondary.main',
                      color: 'secondary.main',
                      backgroundColor: (theme) => `${theme.palette.secondary.main}10`,
                      '& .MuiChip-label': {
                        fontWeight: 500,
                      }
                    }}
                  />
                ))
              ) : (
                <Chip 
                  label="No markets" 
                  size="small" 
                  sx={{
                    backgroundColor: (theme) => `${theme.palette.tertiary.main}10`,
                    color: 'tertiary.main',
                    borderColor: 'tertiary.main'
                  }}
                />
              )}
            </Box>
          </Box>

          {!is_initial_scraped ? (
            <Box sx={{ mt: 2 }}>
              <Alert 
                severity="info" 
                sx={{ 
                  backgroundColor: (theme) => `${theme.palette.tertiary.main}10`,
                  color: 'tertiary.main',
                  '& .MuiAlert-icon': {
                    color: 'tertiary.main'
                  }
                }}
              >
                Markets and Products wait for initial scraping, please come back later or click for a first impression
              </Alert>
              <LinearProgress 
                sx={{ 
                  mt: 2,
                  backgroundColor: (theme) => `${theme.palette.primary.main}15`,
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
                    backgroundColor: (theme) => `${theme.palette.secondary.main}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FaDollarSign size={22} style={{ color: 'secondary.main' }} />
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
                    <CircularProgress size={30} sx={{ color: 'secondary.main' }} />
                  ) : (
                    <CustomSparkLine data={sparklineData} />
                  )}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          color: 'primary.main',
          fontWeight: 600
        }}>
          Edit Cluster Title
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Title"
            type="text"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'secondary.light',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'secondary.main',
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenEditDialog(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: (theme) => `${theme.palette.tertiary.main}15`,
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                await MarketService.updateMarketCluster(cluster.id, { title: newTitle });
                showSnackbar("Title updated successfully");
                fetchMarketClusters();
                setOpenEditDialog(false);
              } catch (error) {
                console.error("Error updating title:", error);
                showSnackbar("Error updating title", "error");
              }
            }}
            variant="contained"
            sx={{
              backgroundColor: 'secondary.main',
              '&:hover': {
                backgroundColor: 'secondary.dark',
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          color: 'error.main',
          fontWeight: 600
        }}>
          Delete Cluster
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this cluster? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenConfirmDialog(false)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: (theme) => `${theme.palette.tertiary.main}15`,
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setDeletingCluster(cluster.id);
              try {
                await MarketService.deleteMarketCluster(cluster.id);
                showSnackbar("Cluster deleted successfully");
                setMarketClusters((prev) =>
                  prev.filter((c) => c.id !== cluster.id)
                );
              } catch (error) {
                console.error("Error deleting cluster:", error);
                showSnackbar("Error deleting cluster", "error");
              }
              setDeletingCluster(null);
              setOpenConfirmDialog(false);
            }}
            variant="contained"
            color="error"
            sx={{
              '&:hover': {
                backgroundColor: 'error.dark',
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default ClusterCard;
