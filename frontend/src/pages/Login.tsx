import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSnackbar } from "../providers/SnackbarProvider";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { IoIosAnalytics } from "react-icons/io";
import { FaSignInAlt } from "react-icons/fa";
import LoginService from "../services/LoginService";
import { commonBackgroundStyle, moveBackgroundKeyframes } from "../components/BackgroundPattern";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Login() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const location = useLocation();
  const [username, setUsername] = useState(location.state?.username || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartValues, setChartValues] = useState<number[]>([15, 20, 25, 30, 35, 40]);

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
    const timer = setInterval(() => {
      setChartValues(generateGrowingValues());
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Market Growth',
        data: chartValues,
        borderColor: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: 'white',
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
          color: 'rgba(255, 255, 255, 0.1)',
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
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'white',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await LoginService.authenticate(username, password);
    setLoading(false);

    if (success) {
      navigate("/dashboard");
    } else {
      showSnackbar("Login failed. Please check your credentials.", "error");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f8f9fa",
        "&::before": {
          ...commonBackgroundStyle,
          opacity: 0.8,
          filter: "contrast(110%)",
        },
        "@keyframes moveBackground": moveBackgroundKeyframes,
      }}
    >
      <Container maxWidth="lg" sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Paper
          elevation={6}
          sx={{
            width: "900px",
            height: "450px",
            display: "flex",
            borderRadius: 3,
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          {/* Left half: Blue box with title */}
          <Box
            sx={{
              width: "50%",
              backgroundColor: "#0096FF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
              position: "relative",
              padding: 3,
              pt: 8,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ mt: 0.5, mr: 1 }}>
                <IoIosAnalytics size={40} color="white" />
              </Box>
              <Typography
                variant="h2"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  letterSpacing: 1,
                  fontSize: "2.5rem",
                }}
              >
                MarketScope
              </Typography>
            </Box>
            <Box sx={{ height: "180px", width: "100%" }}>
              <Line data={chartData} options={chartOptions} />
            </Box>
          </Box>

          {/* Right half: Login form */}
          <Box
            sx={{
              width: "50%",
              p: 4,
              pt: 4,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography
              variant="h5"
              sx={{ 
                mb: 2, 
                textAlign: "center", 
                fontWeight: "bold", 
                color: "primary.main",
              }}
            >
              Welcome Back!
            </Typography>
            <Typography variant="body2" sx={{ textAlign: "center", mb: 3, color: "text.secondary" }}>
              Please log in with your credentials to continue.
            </Typography>

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                startIcon={<FaSignInAlt />}
                sx={{
                  height: 50,
                  fontSize: 16,
                  fontWeight: "bold",
                  textTransform: "none",
                  background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
                  boxShadow: "0 3px 5px 2px rgba(33, 150, 243, .3)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #1565c0 30%, #1976d2 90%)",
                  },
                }}
              >
                {loading ? "Logging in..." : "Sign In"}
              </Button>
            </form>

            <Typography sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ textDecoration: "none", color: "#1976d2", fontWeight: "bold" }}>
                Register now
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
