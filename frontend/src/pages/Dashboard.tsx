import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
import { useNavigate } from "react-router-dom";

import DashboardInsights from "../components/dashboard/DashboardInsights";
import FirstMarketCluster from "../components/dashboard/FirstMarketCluster";
import HeaderSection from "../components/dashboard/HeaderSection";
import LoadingState from "../components/dashboard/LoadingState";
import MarketClustersGrid from "../components/dashboard/MarketClustersGrid";
import ScrapingProcessDashboard from "../components/dashboard/ScrapingProcessDashboard";
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
        {/* Development Preview Accordion */}
        <Box sx={{ mt: 4 }}>
        <ScrapingProcessDashboard
          activeCluster={{
            clustername: "Test Market Cluster",
            status: "processing",
          }}
        />
      </Box>
      
      {/* Overview Section */}
      {marketClusters.length > 0 && (
        <DashboardInsights dashboardData={dashboardData} />
      )}

      {/* Scraping Status Section */}
      {activeCluster && activeCluster.status === "processing" && (
        <ScrapingProcessDashboard activeCluster={activeCluster} />
      )}

      {/* Market Clusters */}
      {marketClusters.length > 0 && (
        <Box>
          <HeaderSection />

          {loading ? (
            <LoadingState />
          ) : (
            <MarketClustersGrid
              marketClusters={marketClusters}
              onClusterClick={(id) => navigate(`/cluster/${id}`)}
              deletingCluster={deletingCluster}
              setMarketClusters={setMarketClusters}
              setDeletingCluster={setDeletingCluster}
              fetchMarketClusters={fetchData}
            />
          )}
        </Box>
      )}

    
    </Box>
  );
};

export default Dashboard;
