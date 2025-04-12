import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
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
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaSignInAlt } from "react-icons/fa";
import { IoIosAnalytics } from "react-icons/io";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  commonBackgroundStyle,
  moveBackgroundKeyframes,
} from "../components/BackgroundPattern";
import { useSnackbar } from "../providers/SnackbarProvider";
import LoginService from "../services/LoginService";

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
  const theme = useTheme();

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
        borderColor: theme.palette.text.primary,
        backgroundColor: `${theme.palette.background.paper}80`,
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: theme.palette.text.primary,
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
        grid: { color: `${theme.palette.background.paper}80` },
        ticks: { display: false },
        border: { display: false },
      },
      x: {
        grid: { color: `${theme.palette.background.paper}80` },
        ticks: { color: theme.palette.text.primary },
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
        backgroundColor: theme.palette.background.default,
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
            background: theme.palette.background.paper,
            backdropFilter: "blur(10px)",
            boxShadow: `0 8px 32px ${theme.palette.background.default}40`,
          }}
        >
          {/* Left: Chart & Logo */}
          <Box
            sx={{
              width: "50%",
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.dark} 100%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 3,
              pt: 8,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Box sx={{ mt: 0.5, mr: 1 }}>
                <IoIosAnalytics size={40} color={theme.palette.text.primary} />
              </Box>
              <Typography
                variant="h2"
                sx={{
                  color: theme.palette.text.primary,
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
                color: theme.palette.text.primary,
              }}
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                mb: 3,
                color: theme.palette.text.secondary,
              }}
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
                sx={{
                  mb: 2,
                  "& .MuiFilledInput-root": {
                    backgroundColor: `${theme.palette.background.default}`,
                    "&:hover": {
                      backgroundColor: `${theme.palette.background.default}`,
                    },
                    "&.Mui-focused": {
                      backgroundColor: `${theme.palette.background.default}`,
                    },
                    "&:before": {
                      borderBottomColor: theme.palette.text.secondary,
                    },
                    "&:hover:before": {
                      borderBottomColor: theme.palette.primary.main,
                    },
                    "& input": {
                      color: theme.palette.text.primary,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme.palette.text.secondary,
                    "&.Mui-focused": {
                      color: theme.palette.primary.main,
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="filled"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{
                  mb: 3,
                  "& .MuiFilledInput-root": {
                    backgroundColor: `${theme.palette.background.default}`,
                    "&:hover": {
                      backgroundColor: `${theme.palette.background.default}`,
                    },
                    "&.Mui-focused": {
                      backgroundColor: `${theme.palette.background.default}`,
                    },
                    "&:before": {
                      borderBottomColor: theme.palette.text.secondary,
                    },
                    "&:hover:before": {
                      borderBottomColor: theme.palette.primary.main,
                    },
                    "& input": {
                      color: theme.palette.text.primary,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme.palette.text.secondary,
                    "&.Mui-focused": {
                      color: theme.palette.primary.main,
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: theme.palette.text.primary }}
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
                  background: `linear-gradient(45deg, ${theme.palette.background.paper} 30%, ${theme.palette.primary.main} 90%)`,
                  boxShadow: `0 3px 5px 2px ${theme.palette.primary.main}40`,
                  "&:hover": {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                  },
                }}
              >
                {loading ? "Logging in..." : "Sign In"}
              </Button>
            </form>

            {/* <Typography
              sx={{
                mt: 2,
                textAlign: "center",
                color: theme.palette.text.secondary,
              }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  textDecoration: "none",
                  color: theme.palette.primary.main,
                  fontWeight: "bold",
                }}
              >
                Register now
              </Link>
            </Typography> */}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
