import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import UserService from "../services/UserService";
import MarketService from "../services/MarketService";
import { useSnackbar } from "../providers/SnackbarProvider";
import { Typography, Container, List, ListItem, ListItemText } from "@mui/material";

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

  return (
    <Container>
      <Typography variant="h4">Willkommen, {username}!</Typography>
      <h2>Meine Market-Cluster</h2>
      <List>
        {marketClusters.map((cluster) => (
          <ListItem key={cluster.id} component={Link} to={`/cluster/${cluster.id}`} sx={{ cursor: "pointer" }}>
          <ListItemText
              primary={`${cluster.title} - Märkte: ${
                cluster.markets && cluster.markets.length > 0
                  ? cluster.markets.map((market: { keyword: string }) => market.keyword).join(", ")
                  : "Keine Märkte"
              }`}
            />

          </ListItem>
        ))}
      </List>
    </Container>
  );
}
