import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import StatCardLarge from "./StatCardLarge";

interface DashboardInsightsProps {
  dashboardData: {
    total_revenue?: string;
    total_clusters?: string;
    total_markets?: string;
    total_unique_products?: string;
  };
}

const DashboardInsights: React.FC<DashboardInsightsProps> = ({ dashboardData }) => {
  return (
    <Box>
      <Typography variant="h1">Market Clusters Overview</Typography>
    
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Here is a quick snapshot of your Total markets Revenue development
      </Typography>
     

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4, md: 3 }}>
          <StatCardLarge
            iconKey="dollar"
            title="30D Revenue Change"
            value={dashboardData?.total_revenue || "0.00"}
            cardId="DDD1"
            isCurrency
            hasSparkline
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCardLarge
            iconKey="clusters"
            title="Total Clusters"
            value={dashboardData?.total_clusters || "0"}
            cardId="DDD2"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCardLarge
            iconKey="markets"
            title="Markets"
            value={dashboardData?.total_markets || "0"}
            cardId="DDD3"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCardLarge
            iconKey="products"
            title="Tracked Products"
            value={dashboardData?.total_unique_products || "0"}
            cardId="DDD4"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardInsights; 