import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Typography,
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
import { Line } from "react-chartjs-2";
import { AiOutlineCheckCircle } from "react-icons/ai";
import {
  FaBox,
  FaBoxes,
  FaChartLine,
  FaDollarSign,
  FaLayerGroup,
} from "react-icons/fa";
import { MdAdd, MdWarningAmber } from "react-icons/md";
import { RiRobot2Fill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import {
  commonBackgroundStyle,
  moveBackgroundKeyframes,
} from "../components/BackgroundPattern";

import ClusterCard from "../components/dashboard/ClusterCard";
import { useSnackbar } from "../providers/SnackbarProvider";
import MarketService from "../services/MarketService";
import { useTheme } from "@mui/material/styles";
import StatCardLarge from "../components/dashboard/StatCardLarge";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  const [chartValues, setChartValues] = useState<number[]>([
    15, 20, 25, 30, 35, 40,
  ]);
  const theme = useTheme();

  const [activeCluster, setActiveCluster] = useState<{
    clustername: string;
    status: string;
    keywords: { [keyword: string]: string };
  } | null>(null);

  // Function to generate new values with overall upward trend but allowing some decreases
  const generateGrowingValues = () => {
    return chartValues.map((currentValue, index) => {
      // 30% chance of a small decrease, 70% chance of increase
      const isDecrease = Math.random() < 0.3;

      if (isDecrease) {
        // Small decrease (max 15% down)
        const decrease = currentValue * (Math.random() * 0.15);
        return Math.max(15, currentValue - decrease);
      } else {
        // Normal growth pattern
        const minGrowth = 1; // Minimum growth
        const maxGrowth = 12; // Maximum growth
        const growth = minGrowth + Math.random() * (maxGrowth - minGrowth);
        const newValue = currentValue + growth;

        // Reset if too high, but ensure new value is higher than previous point (if exists)
        if (newValue > 90) {
          const baseValue = 15;
          return index === 0
            ? baseValue
            : Math.max(chartValues[index - 1] + 2, baseValue);
        }

        return newValue;
      }
    });
  };

  useEffect(() => {
    if (marketClusters.length === 0 && !isFetching) {
      const timer = setInterval(() => {
        setChartValues(generateGrowingValues());
      }, 2500);

      return () => clearInterval(timer);
    }
  }, [marketClusters.length, isFetching]);

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
    const chartData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Market Growth",
          data: chartValues,
          borderColor: "white",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "white",
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1500,
        easing: "easeInOutQuart" as const,
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            display: false,
          },
          border: {
            display: false,
          },
        },
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "white",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    };

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 64px)",
          p: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 600,
            width: "100%",
            background: "linear-gradient(135deg, #1976d2 0%, #2196f3 100%)",
            color: "white",
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              height: 200,
              mb: 3,
            }}
          >
            <Line data={chartData} options={chartOptions} />
          </Box>
          <Typography variant="h4" gutterBottom>
            Welcome to MarketScope
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: "white" }}>
            You haven't created any market clusters yet. Start your journey by
            creating your first one!
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate("/add-market-cluster")}
            sx={{
              backgroundColor: "white",
              color: "primary.main",
              animation: `${pulseAnimation} 2s infinite`,
              "&:hover": {
                backgroundColor: "grey.100",
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
        <Box>
          <Typography variant="h1">Market Clusters Overview</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>
            Here is a quick snapshot of your Total markets Revenue development
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardLarge
                iconKey="static"
                title="30D Revenue Change"
                value={dashboardData?.total_revenue || "0.00"}
                cardId="DDD1"
                isCurrency
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardLarge
                iconKey="static"
                title="30D Revenue Change"
                value={dashboardData?.total_clusters || "0"}
                cardId="DDD2"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardLarge
                iconKey="static"
                title="Market Clusters"
                value={dashboardData?.total_clusters || "0"}
                cardId="DDD3"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardLarge
                iconKey="static"
                title="Tracked Products"
                value={dashboardData?.total_unique_products || "0"}
                cardId="DDD4"
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Scraping Status Section */}
      {activeCluster && activeCluster.status === "processing" && (
        <Paper
          elevation={1}
          sx={{
            p: 3,
            mt: 2,
            borderRadius: 2,
            backgroundColor: "white",
          }}
        >
          {/* Header with animated robot */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 45,
                height: 45,
                borderRadius: "12px",
                backgroundColor: "#e3f2fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: `${robotAnimation} 2s ease-in-out infinite`,
              }}
            >
              <RiRobot2Fill size={24} color="#1976d2" />
            </Box>
            <Typography
              variant="h6"
              color="text.primary"
              sx={{ fontWeight: 600 }}
            >
              Our robots are scraping for you...
            </Typography>
          </Box>

          <Alert
            severity="info"
            sx={{
              mb: 3,
              backgroundColor: "#e3f2fd",
              color: "primary.main",
              "& .MuiAlert-icon": {
                color: "primary.main",
              },
            }}
          >
            We are scraping your markets to get a first impression of your
            cluster. This usually takes some minutes. You can come back later,
            inspect your other clusters or have a coffee.
          </Alert>

          {/* Active Cluster Card */}
          <Card
            elevation={1}
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Cluster Header */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
              >
                <Box
                  sx={{
                    width: 45,
                    height: 45,
                    borderRadius: "12px",
                    backgroundColor: "#e3f2fd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaLayerGroup size={22} color="#1976d2" />
                </Box>
                <Typography
                  variant="h6"
                  color="text.primary"
                  sx={{ fontWeight: 600 }}
                >
                  Cluster to build: {activeCluster.clustername} (Todo: Add
                  cluster type and logo )
                </Typography>
              </Box>

              {/* Scraping Status */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Scraping status:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mt: 1,
                  }}
                >
                  {Object.entries(activeCluster.keywords).map(
                    ([keyword, status]) => (
                      <Box
                        key={keyword}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 2,
                          borderRadius: 1,
                          backgroundColor:
                            status === "done" ? "#e8f5e9" : "#e3f2fd",
                        }}
                      >
                        <Box sx={{ minWidth: 24 }}>
                          {status === "done" ? (
                            <AiOutlineCheckCircle size={20} color="#2e7d32" />
                          ) : (
                            <CircularProgress
                              size={20}
                              sx={{ color: "primary.main" }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              status === "done" ? "#2e7d32" : "primary.main",
                            fontWeight: 500,
                          }}
                        >
                          {keyword}
                        </Typography>
                      </Box>
                    )
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Paper>
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
                // position: "fixed",
                // bottom: 32,
                // right: 32,
                padding: "12px 24px",
                height: "50px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                backgroundColor: "primary.main",
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

      <Box sx={{ mt: 4, p: 2, textAlign: "center" }}>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          <MdWarningAmber size={20} color="#f57c00" />
          <Typography
            variant="subtitle2"
            color="text.secondary"
            fontWeight={600}
          >
            Important Notice
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          <strong>* Disclaimer:</strong> This tool exclusively supports and
          analyzes products from the U.S. Amazon marketplace (
          <em>amazon.com</em>). Data, rankings, and insights are limited to the
          U.S. region and may not reflect availability or performance in other
          countries.
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
