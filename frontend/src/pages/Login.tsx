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
import {
  commonBackgroundStyle,
  moveBackgroundKeyframes,
} from "../components/BackgroundPattern";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
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

export default function Login() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const location = useLocation();
  const [username, setUsername] = useState(location.state?.username || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartValues, setChartValues] = useState<number[]>([
    15, 20, 25, 30, 35, 40,
  ]);

  const generateGrowingValues = () => {
    return chartValues.map((currentValue, index) => {
      const isDecrease = Math.random() < 0.3;
      if (isDecrease) {
        const decrease = currentValue * (Math.random() * 0.15);
        return Math.max(15, currentValue - decrease);
      } else {
        const growth = 1 + Math.random() * (12 - 1);
        const newValue = currentValue + growth;
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
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { display: false },
        border: { display: false },
      },
      x: {
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "white" },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await LoginService.authenticate(username, password);
    setLoading(false);
    success
      ? navigate("/dashboard")
      : showSnackbar("Login failed. Please check your credentials.", "error");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#080F25",
        "&::before": {
          ...commonBackgroundStyle,
          opacity: 0.8,
          filter: "contrast(110%)",
        },
        "@keyframes moveBackground": moveBackgroundKeyframes,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: "900px",
            height: "450px",
            display: "flex",
            borderRadius: 3,
            overflow: "hidden",
            background: "#101935",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          {/* Left: Chart & Logo */}
          <Box
            sx={{
              width: "50%",
              background: "linear-gradient(135deg, #0D1B2A 0%, #143a63 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 3,
              pt: 8,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
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

          {/* Right: Form */}
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
                color: "#E0E7FF",
              }}
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: "center", mb: 3, color: "#AAB4D4" }}
            >
              Please log in with your credentials to continue.
            </Typography>

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Username"
                variant="filled"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              
              />

              <TextField
                fullWidth
                label="Password"
                variant="filled"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: "#E0E7FF" }}
                      >
                        {showPassword ? (
                          <AiOutlineEyeInvisible />
                        ) : (
                          <AiOutlineEye />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={<FaSignInAlt />}
                sx={{
                  height: 50,
                  fontSize: 16,
                  fontWeight: "bold",
                  textTransform: "none",
                  background: "linear-gradient(45deg, #0D1B2A 30%, #1E88E5 90%)",
                  boxShadow: "0 3px 5px 2px rgba(33, 150, 243, .3)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #143a63 30%, #1976d2 90%)",
                  },
                }}
              >
                {loading ? "Logging in..." : "Sign In"}
              </Button>
            </form>

            <Typography
              sx={{
                mt: 2,
                textAlign: "center",
                color: "#AAB4D4",
              }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  textDecoration: "none",
                  color: "#1E88E5",
                  fontWeight: "bold",
                }}
              >
                Register now
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
