import {
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
import { GrCluster } from "react-icons/gr";
import { MdAdd } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ClusterCard from "../components/ClusterCard";
import { useSnackbar } from "../providers/SnackbarProvider";
import MarketService from "../services/MarketService";
import { AiOutlineCheckCircle } from "react-icons/ai";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [marketClusters, setMarketClusters] = useState<any[]>([]);
  const [deletingCluster, setDeletingCluster] = useState<number | null>(null);

  const [activeCluster, setActiveCluster] = useState<{
    clustername: string;
    status: string;
    keywords: { [keyword: string]: string };
  } | null>(null);

  const [isFetching, setIsFetching] = useState<boolean>(true);

  // ✅ Holt alle Market-Cluster des Users
  const fetchMarketClusters = async () => {
    try {
      const data = await MarketService.GetMarketClusters();

      if (data) {
        setMarketClusters(data);
      } else {
        showSnackbar("Fehler beim Laden der Market-Cluster.");
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Market-Cluster:", error);
      showSnackbar("Fehler beim Abrufen der Market-Cluster.");
    }
  };

  // ✅ Holt aktive Scraping-Prozesse und lädt die Keywords nach
  const fetchActiveScrapingCluster = async () => {
    try {
      const data = await MarketService.getActiveScrapingCluster();
      console.log("[DASHBOARD] FETCHED:", data);
      if (!data || data.status === "done") {
        setActiveCluster(null);
        setIsFetching(false); // Stoppt das Refetching
        fetchMarketClusters();
      } else {
        setActiveCluster(data);
        setIsFetching(true); // Falls der Status "processing" bleibt, weiter fetchen
      }
    } catch (error) {
      console.error("Fehler beim Laden des aktiven Scraping-Clusters:", error);
      setIsFetching(false); // Stoppt das Refetching bei Fehlern
    }
  };

  // ✅ Holt die Market-Cluster beim Laden
  useEffect(() => {
    fetchMarketClusters();
  }, []);

  // ✅ Prüft auf aktive Scraping-Prozesse
  useEffect(() => {
    fetchActiveScrapingCluster(); // Initialer Fetch

    if (isFetching) {
      const interval = setInterval(fetchActiveScrapingCluster, 3000);
      return () => clearInterval(interval); // Cleanup, um Memory Leaks zu vermeiden
    }
  }, [isFetching]); // Refetch hängt vom isFetching-Status ab;

  return (
    <Container maxWidth="xl">
      {/* ✅ Zeigt aktive Scraping-Prozesse mit Keywords & Status an */}
      {activeCluster && activeCluster.status === "processing" && (
        <Paper sx={{ paddingY: 4, paddingX: 4, mt: 2, borderRadius: 3 }}>
          <Typography
            variant="h5"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <CircularProgress size={24} sx={{ color: "primary.main" }} />
            Aktive Scraping-Prozesse laufen...
          </Typography>

          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              <Card elevation={5} sx={{ cursor: "pointer", borderRadius: 3 }}>
                <CardHeader
                  sx={{ alignItems: "flex-start" }}
                  avatar={<GrCluster size={28} color="#000010" />}
                  title={
                    <Typography variant="h6">
                      {activeCluster.clustername}
                    </Typography>
                  }
                />
                <CardContent sx={{ minHeight: 200 }}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1">
                      Scraping für folgende Keywords:
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {Object.entries(activeCluster.keywords).map(
                          ([keyword, status]) => (
                            <Box
                              key={keyword}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {/* ✅ Zeigt grünen Haken für "done", sonst Spinner */}
                              {status === "done" ? (
                                <AiOutlineCheckCircle size={18} color="green" />
                              ) : (
                                <CircularProgress
                                  size={16}
                                  sx={{ color: "primary.main" }}
                                />
                              )}
                              <Typography variant="body2">{keyword}</Typography>
                            </Box>
                          )
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* ✅ Zeigt alle Market-Cluster an */}
      <Paper sx={{ paddingY: 4, paddingX: 4, mt: 2 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          My Market Clusters
        </Typography>

        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={3}>
            {marketClusters.map((cluster) => (
              <Grid key={cluster.id} size={4}>
                <ClusterCard
                  cluster={cluster}
                  onClick={() => navigate(`/cluster/${cluster.id}`)}
                  deletingCluster={deletingCluster}
                  setMarketClusters={setMarketClusters}
                  setDeletingCluster={setDeletingCluster}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ✅ Button ist deaktiviert, wenn Scraping läuft */}
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          startIcon={<MdAdd />}
          onClick={() => navigate("/add-market-cluster")}
          disabled={isFetching}
        >
          Add Market Cluster
        </Button>
      </Paper>
    </Container>
  );
};

export default Dashboard;
