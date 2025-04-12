import { Box, Paper, Skeleton, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { IoStatsChart } from "react-icons/io5";
import { useTheme } from "@mui/material/styles";
import CustomStackBars from "../charts/CustomStackChart";
import MetricCardLarge from "./MetricCardLarge";
import MetricCardSmall from "./MetricCardSmall";

interface ClusterInsightsProps {
  stackedChartData: Record<string, { date: string; value: number }[]>;
  marketCluster: any;
  userProducts: any;
}

export default function ClusterInsights({
  stackedChartData,
  marketCluster,
  userProducts,
}: ClusterInsightsProps) {
  const theme = useTheme();

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: "background.paper",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            transition: "transform 0.2s",
            "&:hover": {
              transform: "translateY(-4px)",
            },
            "&:hover .card-id": {
              opacity: 1,
            },
            border: "1px solid rgba(255, 255, 255, 0.25)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "flex-start",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 45,
                height: 45,
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IoStatsChart size={22} color={theme.palette.secondary.main} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              30D Trend
            </Typography>
          </Box>
          <Box>
            {Object.keys(stackedChartData).length === 0 ||
            Object.values(stackedChartData).every((marketData) =>
              marketData.every((entry) => entry.value === 0)
            ) ? (
              <Box>
                <Box sx={{ position: "relative", height: 245 }}>
                  <Skeleton
                    variant="rectangular"
                    animation="wave"
                    width="100%"
                    height="100%"
                    sx={{
                      borderRadius: 1,
                      bgcolor: "gray.100",
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      // backgroundColor: "rgba(255, 255, 255, 0.8)",
                      padding: "8px 16px",
                      borderRadius: 1,
                    }}
                  >
                    Historical market data will be available soon
                  </Typography>
                </Box>
              </Box>
            ) : (
                <Box sx={{ width: '100%' }}>
                <CustomStackBars data={stackedChartData} />
              </Box>
            )}
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <MetricCardLarge
            iconKey="insight"
            title="Cluster Insights"
            value={marketCluster.insights.total_revenue}
            cardId="CD1"
            isCurrency
          />

          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <MetricCardSmall
              iconKey="markets"
              title="Markets"
              value={marketCluster.insights.total_markets}
              cardId="CDD1"
            />
            <MetricCardSmall
              iconKey="products"
              title="Tracked Products"
              value={marketCluster.insights.total_products}
              cardId="CDD2"
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <MetricCardSmall
              iconKey="static"
              title="Metric3"
              value="123"
              cardId="CDD3"
            />
            <MetricCardSmall
              iconKey="static"
              title="Metric4"
              value="123"
              cardId="CDD4"
            />
          </Box>
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <MetricCardLarge
            iconKey="products"
            title="My Products Insights"
            value={userProducts.total_revenue_user_products}
            cardId="CD2"
            isCurrency
            
          />

          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <MetricCardSmall
              iconKey="percent"
              title="Marketshare"
              value={`${userProducts.marketshare}%`}
              cardId="CDD5"
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <MetricCardSmall
              iconKey="products"
              title="My Products"
              value={userProducts.user_products_in_cluster_count}
              cardId="CDD6"
            />
            <MetricCardSmall
              iconKey="static"
              title="Metric3"
              value="123"
              cardId="CDD7"
            />
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
} 