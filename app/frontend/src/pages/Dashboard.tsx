import { Box, Container } from "@mui/material";
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

// [Imports bleiben wie gehabt...]

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [marketClusters, setMarketClusters] = useState<any[]>([]);
  const [loadingClusters, setLoadingClusters] = useState<any[]>([]);
  const [deletingCluster, setDeletingCluster] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [clustersData, overviewData] = await Promise.all([
        MarketService.GetMarketClusters(),
        MarketService.getDashboardOverview(),
      ]);
      if (clustersData) {
        setMarketClusters(clustersData);
        console.log("CLUSTER DATA");
        console.log(clustersData);
      }
      if (overviewData) {
        setDashboardData(overviewData);
        console.log("OVERVIEW DATA");
        console.log(overviewData);
      }
    } catch (error) {
      console.error("[Dashboard] Data fetch error:", error);
      showSnackbar("Error loading dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLoadingClusters = async () => {
    try {
      console.log("GET LOADING CLUSTERS");
      const data = await MarketService.getLoadingClusters();
      console.log(data);
      setLoadingClusters(data ?? []);
    } catch (error) {
      console.error("[Dashboard] Error fetching loading clusters:", error);
    }
  };

  // 🔁 Beim ersten Laden: normale Clusterdaten + laufende Scrapes holen
  useEffect(() => {
    fetchData();
    fetchLoadingClusters();
  }, []);

  // 🔄 Poll alle 5 Sekunden, solange noch Clusters nicht fertig sind
  useEffect(() => {
    if (loadingClusters.length === 0) return;
    const interval = setInterval(() => {
      fetchLoadingClusters();
    }, 20000);
    return () => clearInterval(interval);
  }, [loadingClusters]);

  if (marketClusters.length === 0 && loadingClusters.length === 0 && !loading) {
    return <FirstMarketCluster />;
  }

  return (
    <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, py: 4 }}>
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "primary",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* ⏳ Laufende Cluster */}
      {loadingClusters.map((cluster) => (
        <Box sx={{ mt: 4 }} key={cluster.id}>
          <ScrapingProcessDashboard
            activeCluster={{
              clustername: cluster.title,
              status: "processing",
            }}
          />
        </Box>
      ))}

      {/* 📊 Übersicht */}
      {marketClusters.length > 0 && (
        <DashboardInsights dashboardData={dashboardData} />
      )}

      {/* ✅ Fertige Cluster anzeigen */}
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
      </Container>
  );
};

export default Dashboard;
