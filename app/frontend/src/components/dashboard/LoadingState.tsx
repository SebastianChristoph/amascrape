import { Box, CircularProgress } from "@mui/material";

const LoadingState: React.FC = () => {
  return (
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
  );
};

export default LoadingState; 