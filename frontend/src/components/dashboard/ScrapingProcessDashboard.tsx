import * as React from 'react';
import {
  Box,
  Paper,
  Typography
} from "@mui/material";
import { keyframes } from "@mui/system";
import { useTheme } from "@mui/material/styles";
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

// Add data stream animation
const dataStreamAnimation = keyframes`
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(100%);
    opacity: 0;
  }
`;



// Add pulse animation
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
`;

interface ScrapingProcessDashboardProps {
  activeCluster: {
    clustername: string;
    status: string;
  };
}

const ScrapingProcessDashboard: React.FC<ScrapingProcessDashboardProps> = ({ activeCluster }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mt: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.primary.main}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Data Streams */}
      {[...Array(5)].map((_, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            right: `${index * 40 + 20}px`,
            width: '1px',
            height: '40px',
            background: `linear-gradient(180deg, 
              ${theme.palette.primary.main}20 0%, 
              ${theme.palette.primary.main} 50%,
              ${theme.palette.primary.main}20 100%)`,
            animation: `${dataStreamAnimation} 4s ease-in-out infinite`,
            animationDelay: `${index * 0.4}s`,
          }}
        />
      ))}
      {[...Array(3)].map((_, index) => (
        <Box
          key={`short-${index}`}
          sx={{
            position: 'absolute',
            right: `${index * 25 + 180}px`,
            width: '1px',
            height: '20px',
            background: `linear-gradient(180deg, 
              ${theme.palette.primary.main}20 0%, 
              ${theme.palette.primary.main} 50%,
              ${theme.palette.primary.main}20 100%)`,
            animation: `${dataStreamAnimation} 1.5s ease-in-out infinite`,
            animationDelay: `${index * 0.3}s`,
          }}
        />
      ))}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          position: 'relative',
          zIndex: 1
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            backgroundColor: theme.palette.primary.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: `${robotAnimation} 1.5s ease-in-out infinite`,
          }}
        >
          <RiRobot2Fill size={20} color={theme.palette.common.white} />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ 
                fontWeight: 600, 
                mb: 0.5,
                color: theme.palette.text.primary
              }}
            >
              Scraping cluster: {activeCluster.clustername}
            </Typography>
            <Box 
              sx={{
                animation: `${pulseAnimation} 1.5s ease-in-out infinite`,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ 
                fontWeight: 500,
                color: theme.palette.text.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              This may take a few minutes...
            </Typography>
          
           
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ScrapingProcessDashboard; 