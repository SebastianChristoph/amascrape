import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useEffect, useState } from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { GrCluster } from "react-icons/gr";
import { MdAdd } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ClusterCard from "../components/ClusterCard";
import { useSnackbar } from "../providers/SnackbarProvider";
import MarketService from "../services/MarketService";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [marketClusters, setMarketClusters] = useState<any[]>([]);
  const [deletingCluster, setDeletingCluster] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [activeCluster, setActiveCluster] = useState<{
    clustername: string;
    status: string;
    keywords: { [keyword: string]: string };
  } | null>(null);

  // ✅ Holt alle Market-Cluster des Users
  const fetchMarketClusters = async () => {
    try {
      const data = await MarketService.GetMarketClusters();
      console.log("[DASHBOARD] Aktuelle Market-Cluster:", data);
      if (data) {
        setMarketClusters(data);
      } else {
        showSnackbar("Fehler beim Laden der Market-Cluster.");
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Market-Cluster:", error);
      showSnackbar("Fehler beim Abrufen der Market-Cluster.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Holt aktive Scraping-Prozesse und lädt die Keywords nach
  const fetchActiveScrapingCluster = async () => {
    try {
      const data = await MarketService.getActiveScrapingCluster();
      console.log("[DASHBOARD] FETCHED:", data);
      if (!data) {
        setActiveCluster(null);
        setIsFetching(false);
        fetchMarketClusters();
      } else if (data.status === "done") {
        showSnackbar("Your cluster is ready to go");
        setActiveCluster(null);
        setIsFetching(false);
        fetchMarketClusters();
      } else if (data.status === "error") {
        showSnackbar(
          `Error scraping your new cluster '${activeCluster?.clustername}' !`,
          "error"
        );
        setIsFetching(false);
        setTimeout(fetchMarketClusters, 6000);
      } else {
        setActiveCluster(data);
        setIsFetching(true);
      }
    } catch (error) {
      console.error("Fehler beim Laden des aktiven Scraping-Clusters:", error);
      setIsFetching(false);
    }
  };

  // ✅ Holt die Market-Cluster beim Laden
  useEffect(() => {
    fetchMarketClusters();
  }, []);

  // ✅ Prüft auf aktive Scraping-Prozesse
  useEffect(() => {
    fetchActiveScrapingCluster();
    if (isFetching) {
      const interval = setInterval(fetchActiveScrapingCluster, 3000);
      return () => clearInterval(interval);
    }
  }, [isFetching]);

  return (
    <Container maxWidth="xl">
      {/* ✅ Zeigt aktive Scraping-Prozesse mit Keywords & Status an */}
      {activeCluster && activeCluster.status === "processing" && (
        <Paper sx={{ paddingY: 4, paddingX: 4, mt: 2, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={24} sx={{ color: "primary.main" }} />
            Our robots are scraping for you...
          </Typography>
          <Alert sx={{ mb: 2 }} severity="info">
            We are scraping your markets to get a first impression of your
            cluster. This usually takes some minutes. You can come back later.
          </Alert>
        </Paper>
      )}

      {/* ✅ Zeigt alle Market-Cluster an */}
      <Paper sx={{ paddingY: 4, paddingX: 4, mt: 2 }}>
        <Typography variant="h5" sx={{ mb: 3, backgroundColor: "primary.main", p: 2, color: "white" }}>
          My Market Clusters
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <CircularProgress size={80} color="primary" />
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              {marketClusters.length > 0 ? (
                marketClusters.map((cluster) => (
                  <Grid key={cluster.id} size={{ lg: 6, xs: 12 }}>
                    <ClusterCard
                      cluster={cluster}
                      onClick={() => navigate(`/cluster/${cluster.id}`)}
                      deletingCluster={deletingCluster}
                      setMarketClusters={setMarketClusters}
                      setDeletingCluster={setDeletingCluster}
                      totalRevenue={cluster.total_revenue}
                      fetchMarketClusters={fetchMarketClusters} // ✅ Neue Prop hinzugefügt
                    />
                  </Grid>
                ))
              ) : (
                <Typography sx={{ textAlign: "center", mt: 4 }} variant="body1">
                  No market clusters found.
                </Typography>
              )}
            </Grid>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            sx={{ mt: 2, backgroundColor: "primary.main" }}
            variant="contained"
            startIcon={<MdAdd />}
            onClick={() => navigate("/add-market-cluster")}
            disabled={isFetching}
          >
            Add Market Cluster
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard;
