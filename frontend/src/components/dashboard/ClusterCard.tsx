import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import React, { useState } from "react";
import { useSnackbar } from "../../providers/SnackbarProvider";
import MarketService from "../../services/MarketService";
import CustomSparkLine from "../charts/CustomSparkLine";
import { iconMap, fallbackIcon } from "../../utils/iconUtils";
import { useTheme } from "@mui/material/styles";
import { FaDollarSign, FaEdit, FaTrash } from "react-icons/fa";
import Grid from "@mui/material/Grid2";
interface ClusterCardProps {
  cluster: {
    id: number;
    title: string;
    cluster_type: string;
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
  is_initial_scraped,
}) => {
  const { showSnackbar } = useSnackbar();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(cluster.title);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const cleanKey = (cluster.cluster_type ?? "").trim();
  const theme = useTheme();

  const IconComponent = iconMap[cleanKey] || fallbackIcon;

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
          flex: 1,
          cursor: "pointer",
          backgroundColor: "background.paper",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          borderRadius: 2,
          overflow: "hidden",
          transition: "transform 0.4s",
          "&:hover": {
            transform: "translateY(-10px)",
            "& .delete-button": {
              opacity: 1,
              visibility: "visible",
            },
          },
          "&:hover .card-id": {
            opacity: 1,
          },
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3, minHeight: 300 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconComponent size={22} color={theme.palette.secondary.main} />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="h3"
                  color="text.primary"
                  sx={{ fontWeight: 600 }}
                >
                  {cluster.title}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {cluster.cluster_type}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenConfirmDialog(true);
                }}
                sx={{
                  color: "error.main",
                  opacity: 0,
                  visibility: "hidden",
                  transition: "opacity 0.2s, visibility 0.2s",
                }}
              >
                <FaTrash size={20} color={theme.palette.primary.main} />
              </IconButton>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenEditDialog(true);
                }}
                sx={{ color: "primary.main" }}
              >
                <FaEdit size={20} color={theme.palette.secondary.main} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.primary" gutterBottom>
              Included markets:
            </Typography>
            <Box
              sx={{ display: "flex", flexWrap: "wrap", gap: 1, minHeight: 60 }}
            >
              {Array.isArray(cluster.markets) && cluster.markets.length > 0 ? (
                cluster.markets.map((market, index) => (
                  <Chip
                    key={index}
                    label={market}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderColor: "secondary.main",
                      color: "text.main",
                    }}
                  />
                ))
              ) : (
                <Chip label="No markets" color="default" size="small" />
              )}
            </Box>
          </Box>

          {!is_initial_scraped ? (
            <Box sx={{ mt: 2 }}>
              <Alert
                severity="info"
                sx={{
                  backgroundColor: "#e3f2fd",
                  color: "primary.main",
                  "& .MuiAlert-icon": {
                    color: "primary.main",
                  },
                }}
              >
                Markets and Products wait for initial scraping, please come back
                later or click for a first impression
              </Alert>
              <LinearProgress
                sx={{
                  mt: 2,
                  backgroundColor: "#e3f2fd",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: "primary.main",
                  },
                }}
              />
            </Box>
          ) : (
            <Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Box
                  sx={{
                    width: 45,
                    height: 45,
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaDollarSign
                    size={22}
                    color={theme.palette.secondary.main}
                  />
                </Box>

                <Grid container spacing={4}>
                  <Grid size={{ md: 12, lg: 6 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Total Revenue
                    </Typography>
                    <Typography
                      variant="h1"
                      color="text.primary"
                      sx={{ fontWeight: 600 }}
                    >
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(Number(totalRevenue))}
                    </Typography>
                  </Grid>

                  <Grid size={{ md: 12, lg: 6 }}>
                    {totalRevenue > 0 && (
                      <Box sx={{ mt: 2, height: 50 }}>
                        <CustomSparkLine />
                      </Box>
                    )}
                  </Grid>
                </Grid>

                <Box></Box>
              </Box>
            </Box>
          )}

          <Typography
            className="card-id"
            sx={{
              fontSize: 10,
              color: "gray",
              textAlign: "end",
              opacity: 0,
              transition: "opacity 0.3s ease-in-out",
            }}
          >
            Card-Id: DDD5
          </Typography>
        </CardContent>
      </Card>

      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Delete Market Cluster</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the market cluster "{cluster.title}
            "? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              setDeletingCluster(cluster.id);
              const success = await MarketService.deleteMarketCluster(
                cluster.id
              );
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
                await MarketService.updateMarketCluster(cluster.id, {
                  title: newTitle,
                });
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
