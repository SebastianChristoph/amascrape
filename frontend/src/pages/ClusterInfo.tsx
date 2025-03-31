import React from 'react';
import { Box, Typography, Paper, useTheme, Container } from '@mui/material';
import Grid from "@mui/material/Grid2";
import { styled } from '@mui/material/styles';
import { IoInformationCircle, IoLayers } from 'react-icons/io5';
import { iconMap } from '../utils/iconUtils';

const InfoCard = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(3),
  height: '100%',
  border: "1px solid rgba(255, 255, 255, 0.25)",
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  ...theme.applyStyles('dark', {
    backgroundColor: theme.palette.background.paper,
  }),
}));

// Styled component for the product dots
const ProductDot = styled(Box)(({ theme }) => ({
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: theme.palette.secondary.light,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  color: theme.palette.secondary.contrastText,
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.1)',
    backgroundColor: theme.palette.secondary.main,
  }
}));

// Flip Card Container
const FlipCard = styled(Box)(({ theme }) => ({
  perspective: '1000px',
  width: '100%',
  height: '180px',
  cursor: 'pointer',
  '& .flipCardInner': {
    position: 'relative',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    transition: 'transform 0.8s',
    transformStyle: 'preserve-3d',
  },
  '&:hover .flipCardInner': {
    transform: 'rotateY(180deg)',
  },
}));

// Common styles for both sides of the card
const CardSide = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  height: '100%',
  backfaceVisibility: 'hidden',
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
}));

// Front side of the card
const CardFront = styled(CardSide)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'white',
}));

// Back side of the card
const CardBack = styled(CardSide)(({ theme }) => ({
  backgroundColor: theme.palette.primary.dark,
  color: 'white',
  transform: 'rotateY(180deg)',
  padding: theme.spacing(2),
  justifyContent: 'center',
  alignItems: 'center',
}));

const ClusterInfo: React.FC = () => {
  const theme = useTheme();
  const MarketsIcon = iconMap.markets;
  const MarketIcon = iconMap.market;
  const ProductsIcon = iconMap.products;
  const DynamicIcon = iconMap.dynamic;
  const StaticIcon = iconMap.static;
  const SnapshotIcon = iconMap.snapshot;

  return (
    <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, py: 4 }}>
      
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 4,
        mt: 4,
        px: 4
      }}>
        <IoInformationCircle size={32} style={{ color: theme.palette.text.primary }} />
        <Typography variant="h4" component="h1" sx={{ color: theme.palette.text.primary }}>
          Cluster Information
        </Typography>
      </Box>

      <Box sx={{ px: 4 }}>
        <Grid container spacing={4}>
          {/* MarketCluster Structure Section */}
          <Grid size={{ xs: 12, md: 9 }}>
            <InfoCard>
              <Typography variant="h5" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: theme.palette.text.primary
              }}>
                <IoLayers size={24} />
                MarketCluster Structure
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                A MarketCluster is a collection of up to 5 related Markets, where each Market represents a specific keyword search on Amazon. For example, a "Gaming Laptop" cluster might include markets for "gaming laptop", "gaming notebook", "portable gaming pc", etc. Each Market tracks the top 50 products from Amazon's search results (SERP), monitoring their rankings, prices, ratings, and other key metrics.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                By grouping related Markets together, you can analyze product performance across different but related search terms, identify market trends, and track competitor positions in your target market segment.
              </Typography>
              
              {/* Visual Representation */}
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
              }}>
              
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 3,
                  alignItems: 'center'
                }}>
                  {/* MarketCluster Box */}
                  <Box sx={{ 
                    width: '100%', 
                    p: 2, 
                    borderRadius: 2, 
                    backgroundColor: theme.palette.accent.main,
                    color: 'white',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <MarketsIcon size={24} />
                    MarketCluster
                  </Box>
                  
                  {/* Markets Container */}
                  <Box sx={{ 
                    display: 'flex',
                    gap: 2,
                    width: '100%',
                    justifyContent: 'space-between'
                  }}>
                    {[1, 2, 3].map((market) => (
                      <FlipCard key={market}>
                        <Box className="flipCardInner">
                          <CardFront>
                            {/* Market Front Content */}
                            <Box sx={{
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              p: 2,
                              gap: 2
                            }}>
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1
                              }}>
                                <MarketIcon size={24} />
                                <Typography variant="h6">
                                  Market {market}
                                </Typography>
                              </Box>
                              
                              <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1
                              }}>
                                <ProductsIcon size={20} />
                                <Typography variant="body2">
                                  Contains up to 50 Products
                                </Typography>
                              </Box>
                            </Box>
                          </CardFront>
                          
                          <CardBack>
                            <Box sx={{
                              p: 2,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1
                            }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
                                Example Products in Market
                              </Typography>
                              <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: 1,
                                flex: 1,
                                alignContent: 'center'
                              }}>
                                {[...Array(15)].map((_, i) => (
                                  <ProductDot key={i}>
                                    {i + 1}
                                  </ProductDot>
                                ))}
                              </Box>
                            </Box>
                          </CardBack>
                        </Box>
                      </FlipCard>
                    ))}
                  </Box>
                </Box>
              </Box>
            </InfoCard>
          </Grid>

          {/* Cluster Types Section */}
          <Grid size={{ xs: 12, md: 3 }}>
            <InfoCard>
              <Typography variant="h5" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: theme.palette.text.primary
              }}>
                <IoLayers size={24} />
                Cluster Types
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Dynamic Cluster Type */}
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <DynamicIcon size={20} />
                    Dynamic Cluster
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    A dynamic cluster continuously monitors and updates its data in real-time. It automatically tracks changes in product rankings, prices, and other metrics across all markets within the cluster.
                  </Typography>
                </Box>

                {/* Static Cluster Type */}
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <StaticIcon size={20} />
                    Static Cluster
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    A static cluster captures a fixed point in time of market data. Once created, its data remains unchanged unless manually updated. This type is useful for historical analysis and comparison.
                  </Typography>
                </Box>

                {/* Snapshot Cluster Type */}
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <SnapshotIcon size={20} />
                    Snapshot Cluster
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    A snapshot cluster is a temporary capture of market data at a specific moment. It's useful for quick analysis and doesn't store historical data. Perfect for one-time market research.
                  </Typography>
                </Box>
              </Box>
            </InfoCard>
          </Grid>
        </Grid>
      </Box>
      </Container>
  );
};

export default ClusterInfo; 