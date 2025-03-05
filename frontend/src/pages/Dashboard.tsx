import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import UserService from "../services/UserService";
import MarketService from "../services/MarketService";
import { useSnackbar } from "../providers/SnackbarProvider";
import { Typography, Container, Grid, Card, CardContent, Chip, Stack, Paper, Box } from "@mui/material";

export default function Dashboard() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [marketClusters, setMarketClusters] = useState<any[]>([]);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!UserService.isAuthenticated()) {
      navigate("/"); // Weiterleitung zum Login, falls kein Token vorhanden ist
    } else {
      const user = UserService.getUser();
      setUsername(user?.sub || "Unbekannter Benutzer");
    }
  }, [navigate]);

  useEffect(() => {
    async function fetchMarketClusters() {
      const data = await MarketService.get_market_cluster();
      if (data) {
        setMarketClusters(data);
      } else {
        showSnackbar("Fehler beim Laden der Market-Cluster.");
      }
    }

    fetchMarketClusters();
  }, []);

  return (<>
    <Paper sx={{ paddingY: 4, paddingX: 2, mt: 2 }}>
      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          My market clusters
        </Typography>

        <Grid container spacing={3}>
          {marketClusters.map((cluster) => (
            <Grid item xs={12} sm={6} md={4} key={cluster.id}>
              <Card
                sx={{
                        cursor: "pointer",
                  "&:hover": { boxShadow: 6 },
                }}
                onClick={() => navigate(`/cluster/${cluster.id}`)}
              >
                <CardContent>
                  <Typography variant="h3" gutterBottom>
                    {cluster.title}
                  </Typography>

                  <p>included markets:</p>
                    
                  
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 2 }}>
                    {Array.isArray(cluster.markets) && cluster.markets.length > 0 ? (
                      cluster.markets.map((market: string, index: number) => (
                        <Chip key={index} label={market} variant="outlined" />
                      ))
                    ) : (
                      <Chip label="Keine Märkte" color="default" />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        </Box>
    </Paper>

    <Paper sx={{ paddingY: 4, paddingX: 2, mt: 2 }}>
      <Box>
        <Typography variant="h2" sx={{ mb: 2 }}>
          Other important stuff
        </Typography>

        </Box>
    </Paper>
    </>
    
    
  );
}
