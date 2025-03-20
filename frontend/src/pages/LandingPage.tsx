import { Box, Button, Container, Paper, TextField, Typography, Grid } from "@mui/material";
import { FaChartLine, FaSearchDollar, FaChartBar, FaChartPie } from "react-icons/fa";
import { styled, keyframes } from "@mui/material/styles";

// Animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled components
const AnimatedBox = styled(Box)(({ theme }) => ({
  animation: `${fadeIn} 0.8s ease-out`,
}));

const FeatureIcon = styled(Box)(({ theme }) => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
}));

const LandingPage = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
          color: "white",
          pt: 12,
          pb: 8,
        }}
      >
        <Container maxWidth="lg">
          <AnimatedBox sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: "bold",
                mb: 2,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
              }}
            >
              Gain the Competitive Edge on Amazon – Be Among the First!
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                opacity: 0.9,
                maxWidth: "800px",
                mx: "auto",
              }}
            >
              Our new tool lets you analyze amazon markets, identify opportunities, and track your marketshare
            </Typography>
            
            <Box
              component="form"
              sx={{
                display: "flex",
                gap: 2,
                maxWidth: "600px",
                mx: "auto",
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                placeholder="Enter your email"
                variant="outlined"
                fullWidth
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 1,
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.5)",
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: "white",
                  color: "primary.main",
                  px: 4,
                  "&:hover": {
                    backgroundColor: "grey.100",
                  },
                }}
              >
                Join the Waitlist
              </Button>
            </Box>
          </AnimatedBox>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <AnimatedBox sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              mb: 6,
              color: "primary.main",
            }}
          >
            Understand Any Amazon Market Like Never Before
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: "100%",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)" },
                }}
              >
                <FeatureIcon>
                  <FaChartLine size={30} color="#1976d2" />
                </FeatureIcon>
                <Typography variant="h6" gutterBottom>
                  Track Competitors
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitor competitor sales, prices, and market movements in real-time
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: "100%",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)" },
                }}
              >
                <FeatureIcon>
                  <FaSearchDollar size={30} color="#1976d2" />
                </FeatureIcon>
                <Typography variant="h6" gutterBottom>
                  Identify Opportunities
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Instantly spot opportunities and risks in your niche
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: "100%",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)" },
                }}
              >
                <FeatureIcon>
                  <FaChartBar size={30} color="#1976d2" />
                </FeatureIcon>
                <Typography variant="h6" gutterBottom>
                  Visualize Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  See your marketshare in an intuitive dashboard
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: "100%",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)" },
                }}
              >
                <FeatureIcon>
                  <FaChartPie size={30} color="#1976d2" />
                </FeatureIcon>
                <Typography variant="h6" gutterBottom>
                  Market Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Capture total marketsizes to decide where to invest
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </AnimatedBox>
      </Container>

      {/* Social Proof Section */}
      <Box sx={{ backgroundColor: "primary.main", color: "white", py: 8 }}>
        <Container maxWidth="lg">
          <AnimatedBox sx={{ textAlign: "center" }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
              Developed by Amazon Experts
            </Typography>
            <Typography variant="h3" sx={{ mb: 2 }}>
              ⭐⭐⭐⭐⭐
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              100+ Amazon sellers already on the waitlist
            </Typography>
          </AnimatedBox>
        </Container>
      </Box>

      {/* Urgency Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <AnimatedBox
          sx={{
            textAlign: "center",
            maxWidth: 600,
            mx: "auto",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              mb: 2,
              color: "primary.main",
            }}
          >
            Only 100 Spots Available – Don't Miss Out!
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, color: "text.secondary" }}>
            Secure your spot before it's too late.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{
              px: 6,
              py: 2,
              fontSize: "1.2rem",
              background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
              boxShadow: "0 3px 5px 2px rgba(33, 150, 243, .3)",
              "&:hover": {
                background: "linear-gradient(45deg, #1565c0 30%, #1976d2 90%)",
              },
            }}
          >
            Join the Waitlist
          </Button>
        </AnimatedBox>
      </Container>
    </Box>
  );
};

export default LandingPage; 