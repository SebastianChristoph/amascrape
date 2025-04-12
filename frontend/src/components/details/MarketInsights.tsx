import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import MetricCardLarge from "./MetricCardLarge";
import MetricCardSmall from "./MetricCardSmall";

interface MarketInsightsProps {
  market: any;
  userProducts: any;
  index: number;
}

export default function MarketInsights({ market, userProducts, index }: MarketInsightsProps) {
  return (
    <Grid container spacing={2} alignItems="stretch">
      <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex" }}>
        <Box sx={{ flex: 1 }}>
          <MetricCardLarge
            iconKey="insight"
            title="Market Insights"
            value={market.revenue_total}
            cardId="DDM1"
            isCurrency
            
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            width: "100%",
            flex: 1,
          }}
        >
          <MetricCardSmall
            iconKey="products"
            title="Tracked Products"
            value={market.products_in_market_count}
            cardId="DDM2"
          />
          <MetricCardSmall
            iconKey="static"
            title="AVG"
            value={market.avg_blm}
            cardId="DDM3"
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex" }}>
        <Box sx={{ flex: 1 }}>
          <MetricCardLarge
            iconKey="products"
            title="My Products Insights"
            value={
              userProducts["markets"][index][
                "total_revenue_user_products"
              ]
            }
            cardId="DDM4"
            isCurrency
            
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex" }}>
        <Box sx={{ flex: 1 }}>
          <MetricCardLarge
            iconKey="percent"
            title="My Marketshare"
            value={userProducts["markets"][index]["marketshare"]}
            cardId="DDM5"
            isCurrency
            
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            width: "100%",
            flex: 1,
          }}
        >
          <MetricCardSmall
            iconKey="products"
            title="My Products"
            value={
              userProducts["markets"][index][
                "user_products_in_market_count"
              ]
            }
            cardId="DDM6"
          />
          <MetricCardSmall
            iconKey="static"
            title="Metric2"
            value="123"
            cardId="DDM7"
          />
        </Box>
      </Grid>
    </Grid>
  );
} 