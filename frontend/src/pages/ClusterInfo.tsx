import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
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
  width: 8,
  height: 8,
  borderRadius: '50%',  
  backgroundColor: theme.palette.secondary.main,
    display: 'inline-block',
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
    <Box sx={{ py: 4 }}>
      <Typography variant="h1" component="h1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        color: theme.palette.text.primary
      }}>
        <IoInformationCircle size={32} />
        Cluster Information
      </Typography>

      <Grid container spacing={4} sx={{ mt: 6 }}>
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
            <Typography variant="body1" color="text.secondary">
              A MarketCluster is a collection of up to 5 related Markets, where each Market represents a specific keyword search on Amazon.
            </Typography>
            
            {/* Visual Representation */}
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              borderRadius: 2, 
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
            }}>
              <Typography variant="subtitle1" gutterBottom>
                MarketCluster Structure:
              </Typography>
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
                
                {/* Markets with Products Container */}
                <Box sx={{ 
                  display: 'flex',
                  gap: 2,
                  width: '100%',
                  justifyContent: 'space-between'
                }}>
                  {[1, 2, 3].map((market) => (
                    <Box key={market} sx={{ 
                      flex: 1
                    }}>
                      {/* Market Header */}
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        mb: 1
                      }}>
                        <MarketIcon size={20} />
                        Market {market}
                      </Box>
                      
                      {/* Products Visualization */}
                      <Box sx={{ 
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: theme.palette.secondary.main
                        }}>
                          <ProductsIcon size={16} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Contains up to 50 Products:
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          p: 1
                        }}>
                          {[...Array(15)].map((_, i) => (
                            <ProductDot key={i} />
                          ))}
                          
                        </Box>
                      </Box>
                    </Box>
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
  );
};

export default ClusterInfo; 