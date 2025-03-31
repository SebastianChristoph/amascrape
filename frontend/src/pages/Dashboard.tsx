import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Typography
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { keyframes } from "@mui/system";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";
import {
  FaLayerGroup,
} from "react-icons/fa";
import { MdAdd, MdWarningAmber } from "react-icons/md";
import { RiRobot2Fill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

import { useTheme } from "@mui/material/styles";
import ClusterCard from "../components/dashboard/ClusterCard";
import DashboardInsights from "../components/dashboard/DashboardInsights";
import FirstMarketCluster from "../components/dashboard/FirstMarketCluster";
import ScrapingProcessDashboard from "../components/dashboard/ScrapingProcessDashboard";
import StatCardLarge from "../components/dashboard/StatCardLarge";
import Disclaimer from "../components/Disclaimer";
import { useSnackbar } from "../providers/SnackbarProvider";
import MarketService from "../services/MarketService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Add robot animation keyframes
const robotAnimation = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
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
  const theme = useTheme();

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
        MarketService.getDashboardOverview(),
      ]);

      if (clustersData) {
        console.log("[DEBUG] ClusterData:", clustersData);
        setMarketClusters(clustersData);
      }
      if (overviewData) {
        console.log("[DEBUG] OverviewData:", overviewData);
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

  // Fetch data every 20 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
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
    return <FirstMarketCluster />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "primary",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Overview Section */}
      {marketClusters.length > 0 && (
        <DashboardInsights dashboardData={dashboardData} />
      )}

      {/* Scraping Status Section */}
      {activeCluster && activeCluster.status === "processing" && (
        <ScrapingProcessDashboard activeCluster={activeCluster} />
      )}

      {/* Market Clustrs */}
      {marketClusters.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h1" sx={{ mb: 4 }}>
              My Market Clusters
            </Typography>
            

            <Button
              variant="contained"
              color="primary"
              startIcon={<MdAdd size={24} />}
              onClick={() => navigate("/add-market-cluster")}
              sx={{
                padding: "12px 24px",
                height: "50px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                backgroundColor: theme.palette.accent.main,
                "&:hover": {
                  backgroundColor: "primary.dark",
                  transform: "scale(1.05)",
                  transition: "all 0.2s ease-in-out",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                },
              }}
            >
              Add Market Cluster
            </Button>
           
          </Box>
        
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "200px",
              }}
            >
              <CircularProgress size={80} color="primary" />
            </Box>
          ) : (
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={3}>
                {marketClusters.length > 0 ? (
                  marketClusters.map((cluster) => (
                    <Grid key={cluster.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <ClusterCard
                        cluster={cluster}
                        onClick={() => navigate(`/cluster/${cluster.id}`)}
                        deletingCluster={deletingCluster}
                        setMarketClusters={setMarketClusters}
                        setDeletingCluster={setDeletingCluster}
                        totalRevenue={cluster.total_revenue}
                        is_initial_scraped={cluster.is_initial_scraped}
                        fetchMarketClusters={fetchData}
                      />
                    </Grid>
                  ))
                ) : (
                  <Typography
                    sx={{ textAlign: "center", mt: 4 }}
                    variant="body1"
                  >
                    No market clusters found.
                  </Typography>
                )}
              </Grid>
            </Box>
          )}
        </Box>
      )}

      {/* Extended Add Market Cluster Button */}

      <Disclaimer />
    </Box>
  );
};

export default Dashboard;
