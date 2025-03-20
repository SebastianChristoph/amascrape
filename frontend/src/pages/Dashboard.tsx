import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  Typography
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { keyframes } from '@mui/system';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { useEffect, useRef, useState } from "react";
import { Line } from 'react-chartjs-2';
import { AiOutlineCheckCircle } from "react-icons/ai";
import { FaBoxes, FaChartLine, FaDollarSign, FaLayerGroup, FaStore } from 'react-icons/fa';
import { MdAdd } from "react-icons/md";
import { RiRobot2Fill } from 'react-icons/ri';
import { useNavigate } from "react-router-dom";
import { commonBackgroundStyle, moveBackgroundKeyframes } from "../components/BackgroundPattern";
import ClusterCard from "../components/ClusterCard";
import { useSnackbar } from "../providers/SnackbarProvider";
import MarketService from "../services/MarketService";
import { useTheme } from '@mui/material/styles';

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
  const theme = useTheme();
  const [marketClusters, setMarketClusters] = useState<any[]>([]);
  const [deletingCluster, setDeletingCluster] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [chartValues, setChartValues] = useState<number[]>([15, 20, 25, 30, 35, 40]);

  const [activeCluster, setActiveCluster] = useState<{
    clustername: string;
    status: string;
    keywords: { [keyword: string]: string };
  } | null>(null);

  const pulseAnimation = keyframes`
    0% {
      box-shadow: 0 0 0 0 ${theme.palette.common.white}66;
    }
    70% {
      box-shadow: 0 0 0 10px ${theme.palette.common.white}00;
    }
    100% {
      box-shadow: 0 0 0 0 ${theme.palette.common.white}00;
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
          return index === 0 ? baseValue : Math.max(chartValues[index - 1] + 2, baseValue);
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
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Market Growth',
          data: chartValues,
          borderColor: theme.palette.common.white,
          backgroundColor: `${theme.palette.common.white}1A`,
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: theme.palette.common.white,
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart' as const,
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: `${theme.palette.common.white}1A`,
          },
          ticks: {
            display: false,
          },
          border: {
            display: false
          }
        },
        x: {
          grid: {
            color: `${theme.palette.common.white}1A`,
          },
          ticks: {
            color: theme.palette.common.white,
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
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            color: (theme) => theme.palette.common.white,
            borderRadius: 2,
            textAlign: 'center',
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
          <Typography variant="body1" sx={{ mb: 4, color: theme.palette.common.white }}>
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
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: (theme) => theme.palette.background.default,
        "&::before": {
          ...commonBackgroundStyle,
          opacity: 0.8,
          filter: "contrast(110%)",
        },
        "@keyframes moveBackground": moveBackgroundKeyframes,
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
            <CircularProgress sx={{ color: "secondary.main" }} />
          </Box>
        ) : (
          <>
            {/* Overview Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Total Products Card */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    height: "100%",
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <FaBoxes size={24} style={{ marginRight: "8px", color: theme.palette.secondary.light }} />
                      <Typography variant="h6" component="div">
                        Total Products
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
                      {dashboardData?.totalProducts || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Across all clusters
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Average Price Card */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    height: "100%",
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <FaDollarSign size={24} style={{ marginRight: "8px", color: theme.palette.secondary.light }} />
                      <Typography variant="h6" component="div">
                        Average Price
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
                      ${dashboardData?.averagePrice?.toFixed(2) || "0.00"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Market average
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Total Markets Card */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    height: "100%",
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <FaStore size={24} style={{ marginRight: "8px", color: theme.palette.secondary.light }} />
                      <Typography variant="h6" component="div">
                        Total Markets
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
                      {dashboardData?.totalMarkets || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Active marketplaces
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Market Clusters Card */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    height: "100%",
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <FaLayerGroup size={24} style={{ marginRight: "8px", color: theme.palette.secondary.light }} />
                      <Typography variant="h6" component="div">
                        Market Clusters
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
                      {marketClusters.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Active clusters
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Market Clusters Section */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: "bold",
                  color: "primary.main",
                  position: "relative",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: -8,
                    left: 0,
                    width: "60px",
                    height: "3px",
                    backgroundColor: "tertiary.main",
                    borderRadius: "2px"
                  }
                }}>
                  Market Clusters
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<MdAdd />}
                  onClick={() => navigate("/add-market-cluster")}
                  sx={{
                    backgroundColor: "secondary.main",
                    "&:hover": {
                      backgroundColor: "secondary.dark",
                    },
                    borderRadius: "8px",
                    textTransform: "none",
                    px: 3
                  }}
                >
                  Create New Cluster
                </Button>
              </Box>

              {/* Active Scraping Alert */}
              {activeCluster && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    backgroundColor: "tertiary.main",
                    color: "white",
                    "& .MuiAlert-icon": {
                      color: "white"
                    },
                    display: "flex",
                    alignItems: "center"
                  }}
                  icon={
                    <Box
                      sx={{
                        animation: `${robotAnimation} 2s ease-in-out infinite`,
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <RiRobot2Fill size={24} />
                    </Box>
                  }
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body1" sx={{ mr: 1 }}>
                      Currently scraping cluster "{activeCluster.clustername}"
                    </Typography>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "white",
                        animation: `${pulseAnimation} 2s infinite`,
                      }}
                    />
                  </Box>
                </Alert>
              )}

              {/* Empty State */}
              {marketClusters.length === 0 && !isFetching && (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: "center",
                    background: (theme) => `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.paper}D9 100%)`,
                    backdropFilter: "blur(10px)",
                    borderRadius: 3,
                  }}
                >
                  <Box sx={{ mb: 3 }}>
                    <FaChartLine size={48} style={{ color: theme.palette.secondary.main }} />
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
                    No Market Clusters Yet
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
                    Create your first market cluster to start analyzing product data
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<MdAdd />}
                    onClick={() => navigate("/create-cluster")}
                    sx={{
                      backgroundColor: "secondary.main",
                      "&:hover": {
                        backgroundColor: "secondary.dark",
                      },
                      borderRadius: "8px",
                      textTransform: "none",
                      px: 4,
                      py: 1.5
                    }}
                  >
                    Create First Cluster
                  </Button>
                </Paper>
              )}

              {/* Cluster Grid */}
              {marketClusters.length > 0 && (
                <Grid container spacing={3}>
                  {marketClusters.map((cluster: any) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cluster.id}>
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
                  ))}
                </Grid>
              )}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
