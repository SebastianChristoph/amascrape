import { Box, Button, Paper, Typography, Grid } from "@mui/material";
import { keyframes } from "@mui/system";
import { Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

const slideInAnimation = keyframes`
  0% {
    opacity: 0;
    transform: perspective(1000px) rotateY(-90deg) translateX(100px) scale(0.5);
    transform-origin: right center;
  }
  100% {
    opacity: 1;
    transform: perspective(1000px) rotateY(0) translateX(0) scale(1);
    transform-origin: right center;
  }
`;

const unfoldAnimation = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-50%) scaleX(0.1) scaleY(0.5);
    transform-origin: left center;
  }
  50% {
    opacity: 0.5;
    transform: translateX(-30%) scaleX(0.6) scaleY(0.8);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scaleX(1) scaleY(1);
  }
`;

const FirstMarketCluster: React.FC = () => {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [chartValues, setChartValues] = useState<number[]>([
    15, 20, 25, 30, 35, 40,
  ]);

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
    const timer = setInterval(() => {
      setChartValues(generateGrowingValues());
    }, 2500);

    return () => clearInterval(timer);
  }, []);

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
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
        p: 3,
        position: 'relative',
      }}
    >
      <Grid container spacing={2} justifyContent="center" alignItems="center">
        <Grid xs={12} md={6}>
          <Paper
            elevation={3}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            sx={{
              p: 4,
              maxWidth: 600,
              width: "100%",
              background: "linear-gradient(135deg, #0D1B2A 0%, #143a63 100%)",
              color: "white",
              borderRadius: 2,
              textAlign: "center",
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box sx={{ height: 200, mb: 3 }}>
              <Line data={chartData} options={chartOptions} />
            </Box>
            <Typography variant="h4" gutterBottom>
              Welcome to MarketScope
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: "white" }}>
              You haven't created any market clusters yet. Start your journey by creating your first one!
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
        </Grid>
        
        <Grid 
          xs={12} 
          md={4}
          sx={{
            position: { xs: 'relative', md: 'absolute' },
            right: { xs: 'auto', md: '20px' },
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: isHovering ? 1 : 0,
            visibility: isHovering ? 'visible' : 'hidden',
            transition: 'all 0.4s ease-in-out',
            pointerEvents: isHovering ? 'auto' : 'none',
          }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #143a63 0%, #0D1B2A 100%)',
              color: 'white',
              borderRadius: 2,
              maxWidth: '100%',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
              transform: isHovering ? 'scale(1)' : 'scale(0.98)',
              transition: 'transform 0.4s ease-in-out',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '-8px',
                width: '16px',
                height: '16px',
                background: 'linear-gradient(135deg, #143a63 0%, #0D1B2A 100%)',
                transform: 'translateY(-50%) rotate(45deg)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <Typography variant="h5" gutterBottom>
              What is a Market Cluster?
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              A Market Cluster is a powerful tool that helps you group and analyze related market segments together.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              • Group similar markets together
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              • Track performance metrics
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              • Identify market trends
            </Typography>
            <Typography variant="body2">
              • Make data-driven decisions
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FirstMarketCluster; 