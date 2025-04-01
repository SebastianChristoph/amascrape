import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import ClusterCard from "./ClusterCard";
import { Dispatch, SetStateAction } from "react";

interface MarketClustersGridProps {
  marketClusters: any[];
  onClusterClick: (id: number) => void;
  deletingCluster: number | null;
  setMarketClusters: Dispatch<SetStateAction<any[]>>;
  setDeletingCluster: Dispatch<SetStateAction<number | null>>;
  fetchMarketClusters: () => void;
}

const MarketClustersGrid: React.FC<MarketClustersGridProps> = ({
  marketClusters,
  onClusterClick,
  deletingCluster,
  setMarketClusters,
  setDeletingCluster,
  fetchMarketClusters,
}) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {marketClusters.length > 0 ? (
          marketClusters.map((cluster) => (
            <Grid key={cluster.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <ClusterCard
                cluster={cluster}
                onClick={() => onClusterClick(cluster.id)}
                deletingCluster={deletingCluster}
                setMarketClusters={setMarketClusters}
                setDeletingCluster={setDeletingCluster}
                totalRevenue={cluster.total_revenue}
                is_initial_scraped={cluster.is_initial_scraped}
                fetchMarketClusters={fetchMarketClusters}
              />
            </Grid>
          ))
        ) : (
          <Typography sx={{ textAlign: "center", mt: 4 }} variant="body1">
            No market clusters found.
          </Typography>
        )}
      </Grid>
    </Box>
  );
};

export default MarketClustersGrid; 