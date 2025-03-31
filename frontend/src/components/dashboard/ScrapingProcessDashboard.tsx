import * as React from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Typography
} from "@mui/material";
import { keyframes } from "@mui/system";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { FaLayerGroup } from "react-icons/fa";
import { RiRobot2Fill } from "react-icons/ri";

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

interface ScrapingProcessDashboardProps {
  activeCluster: {
    clustername: string;
    status: string;
    keywords: { [keyword: string]: string };
  };
}

const ScrapingProcessDashboard: React.FC<ScrapingProcessDashboardProps> = ({ activeCluster }) => {
  return (
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
  );
};

export default ScrapingProcessDashboard; 