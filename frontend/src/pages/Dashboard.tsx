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
import CustomSparkLine from "../components/charts/CustomSparkLine";
import { FaRocket } from 'react-icons/fa';
import { keyframes } from '@mui/system';

const rocketAnimation = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
`;

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
`;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [marketClusters, setMarketClusters] = useState<any[]>([]);
  const [deletingCluster, setDeletingCluster] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeCluster, setActiveCluster] = useState<{
    clustername: string;
    status: string;
    keywords: { [keyword: string]: string };
  } | null>(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      const [clustersData, overviewData] = await Promise.all([
        MarketService.GetMarketClusters(),
        MarketService.getDashboardOverview()
      ]);

      if (clustersData) {
        console.log("[DEBUG] ClusterData:", clustersData)
        setMarketClusters(clustersData);
      }
      if (overviewData) {
        console.log("[DEBUG] OverviewData:", overviewData)
        setDashboardData(overviewData);
      }
    } catch (error) {
      console.error("[Dashboard] Data fetch error:", error);
      showSnackbar("Error loading dashboard data", "error");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // ✅ Holt aktive Scraping-Prozesse und lädt die Keywords nach
  const fetchActiveScrapingCluster = async () => {
    try {
      const data = await MarketService.getActiveScrapingCluster();
      if (!data) {
        setActiveCluster(null);
        setIsFetching(false);
        fetchData();
        console.log("keine aktiven scraping market clusters");
      } else if (data.status === "done") {
        showSnackbar("Your cluster is ready to go");
        setActiveCluster(null);
        setIsFetching(false);
        fetchData();
      } else if (data.status === "error") {
        showSnackbar(
          `Error scraping your new cluster '${activeCluster?.clustername}' !`,
          "error"
        );
        setIsFetching(false);
        setTimeout(fetchData, 6000);
      } else {
        setActiveCluster(data);
        console.log("data active clusters:", data);
        setIsFetching(true);
      }
    } catch (error) {
      console.error("[Dashboard] Active cluster error:", error);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Prüft auf aktive Scraping-Prozesse
  useEffect(() => {
    fetchActiveScrapingCluster();
    if (isFetching) {
      const interval = setInterval(fetchActiveScrapingCluster, 3000);
      return () => clearInterval(interval);
    }
  }, [isFetching]);

  if (marketClusters.length === 0 && !isFetching) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 64px)',
          p: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 600,
            width: '100%',
            background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
            color: 'white',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
              animation: `${rocketAnimation} 2s infinite ease-in-out`,
            }}
          >
            <FaRocket
              size={48}
              style={{
                color: 'white'
              }}
            />
          </Box>
          <Typography variant="h4" gutterBottom>
            Welcome to Market Analysis
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 , color: 'white'}}>
            You haven't created any market clusters yet. Start your journey by creating your first one!
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/add-market-cluster')}
            sx={{
              backgroundColor: 'white',
              color: 'primary.main',
              animation: `${pulseAnimation} 2s infinite`,
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
          >
            Create Your First Market Cluster
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Overview Section */}
      <Paper elevation={3} sx={{ marginBottom: 2, padding: 4 }}>
        <Typography
          variant="h5"
          sx={{
            mb: 4,
            backgroundColor: "primary.main",
            color: "white",
            padding: 2,
          }}
        >
          Market Clusters Overview
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Here is a quick snapshot of your Total markets Revenue development
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total 30D Revenue
                  </Typography>
                  <Typography variant="h4">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(dashboardData?.total_revenue || 0)}
                  </Typography>
                  {dashboardData?.clusters_without_revenue > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {dashboardData.clusters_without_revenue} cluster(s) still scraping
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    30D Revenue change
                  </Typography>
                  <Box sx={{ height: 50 }}>
                    {dashboardData?.revenue_development && (
                      <CustomSparkLine data={dashboardData.revenue_development} />
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Number of market clusters
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.total_clusters || 0}
                  </Typography>
                  {dashboardData?.clusters_without_revenue > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {dashboardData.clusters_without_revenue} cluster(s) still being scraped
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Number of tracked products
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.total_unique_products || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      {/* ✅ Zeigt aktive Scraping-Prozesse mit Keywords & Status an */}
      {activeCluster && activeCluster.status === "processing" && (
          <Paper elevation={3} sx={{ paddingY: 4, paddingX: 4, mt: 2, borderRadius: 3 }}>
          <Typography
            variant="h5"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <CircularProgress size={24} sx={{ color: "primary.main" }} />
            Our robots are scraping for you...
          </Typography>

          <Alert sx={{ mb: 2 }} severity="info">
            We are scraping your markets to get a first impression of your
            cluster. This usually takes some minutes. You can come back later,
            inspect your other clusters or have a coffee.
          </Alert>

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
                <CardContent>
                  <Box>
                    <Typography variant="body1">Scraping status:</Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
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
                </CardContent>
              </Card>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* ✅ Zeigt alle Market-Cluster an */}
      <Paper elevation={3} sx={{ paddingY: 4, paddingX: 4, mt: 2 }}>
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
                  <Grid key={cluster.id} size={{ xs: 12, sm: 12, lg: 6 }}>
                    <ClusterCard
                      cluster={cluster}
                      onClick={() => navigate(`/cluster/${cluster.id}`)}
                      deletingCluster={deletingCluster}
                      setMarketClusters={setMarketClusters}
                      setDeletingCluster={setDeletingCluster}
                      totalRevenue={cluster.total_revenue}
                      fetchMarketClusters={fetchData}
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
