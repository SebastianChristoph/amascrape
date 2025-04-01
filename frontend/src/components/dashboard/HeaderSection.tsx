import { Box, Typography } from "@mui/material";
import AddMarketClusterButton from "./AddMarketClusterButton";

const HeaderSection: React.FC = () => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Typography variant="h1" sx={{ mb: 4 }}>
        My Market Clusters
      </Typography>
      <AddMarketClusterButton />
    </Box>
  );
};

export default HeaderSection; 