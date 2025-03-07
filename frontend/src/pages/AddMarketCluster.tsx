import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Typography, Box, Chip, Drawer, List, ListItem, CircularProgress } from "@mui/material";
import MarketService from "../services/MarketService";

export default function AddMarketCluster() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [scrapingStatus, setScrapingStatus] = useState<{ [key: string]: string }>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [taskMap, setTaskMap] = useState<{ [keyword: string]: string }>({}); // 🔥 Verknüpft Keywords mit Task-IDs
  const [clusterId, setClusterId] = useState<number | null>(null);

  // ✅ Keyword zur Liste hinzufügen
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  // ✅ Market Cluster mit mehreren Keywords erstellen
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const response = await MarketService.createMarketCluster({ title, keywords });

    if (response.success) {
      console.log("✅ Cluster erfolgreich erstellt, Task-IDs:", response.data.task_ids);

      // 🔥 Task-IDs den jeweiligen Keywords zuordnen
      const newTaskMap: { [keyword: string]: string } = {};
      keywords.forEach((keyword, index) => {
        newTaskMap[keyword] = response.data.task_ids[index];
      });
      setTaskMap(newTaskMap);

      // 🔥 Scraping-Status initialisieren (jedes Keyword bekommt "loading")
      const initialStatus = keywords.reduce((acc: any, keyword: string) => {
        acc[keyword] = "loading";
        return acc;
      }, {});
      setScrapingStatus(initialStatus);

      // 🔥 Cluster-ID speichern
      setClusterId(response.data.id);

      // 🔥 Drawer öffnen!
      setDrawerOpen(true);

      // 🔥 Starte das Polling
      startPolling(newTaskMap);
    } else {
      alert("Fehler beim Erstellen des Market Clusters");
    }
  };

  // ✅ Starte das Polling für alle Tasks parallel
  const startPolling = (taskMap: { [keyword: string]: string }) => {
    console.log("⏳ [Starte Polling für Scraping-Tasks...]");

    Object.entries(taskMap).forEach(([keyword, taskId]) => {
      const interval = setInterval(async () => {
        const status = await MarketService.checkScrapingStatus(taskId);
        console.log(`📡 [Polling] Task: ${taskId}, Status: ${status.status}`);

        setScrapingStatus((prev) => ({
          ...prev,
          [keyword]: status.status === "completed" ? "completed" : "loading",
        }));

        if (status.status === "completed") {
          console.log(`✅ [Task abgeschlossen] Task: ${taskId}`);
          clearInterval(interval);
        }

        // 🔥 Prüfen, ob ALLE Tasks fertig sind
        if (Object.values(scrapingStatus).every((status) => status === "completed")) {
          console.log("✅ [ALLE TASKS COMPLETED] Link wird sichtbar!");
        }
      }, 3000);
    });
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Add Market Cluster
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Cluster Title"
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Market Keyword"
            variant="outlined"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
          />
          <Button onClick={handleAddKeyword} variant="contained">
            Add
          </Button>
        </Box>

        <Box sx={{ mb: 2 }}>
          {keywords.map((keyword, index) => (
            <Chip key={index} label={keyword} sx={{ mr: 1 }} />
          ))}
        </Box>

        <Button type="submit" variant="contained" color="primary" fullWidth>
          Create Market Cluster
        </Button>
      </form>

      {/* 📌 Drawer für Scraping */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6">Scraping Status</Typography>
          <List>
            {keywords.map((keyword, index) => (
              <ListItem key={index}>
                {scrapingStatus[keyword] === "loading" ? <CircularProgress size={20} /> : "✅ Completed"} {keyword}
              </ListItem>
            ))}
          </List>

          {/* ✅ Wenn alle Tasks fertig sind, zeige den Link */}
          {keywords.length > 0 && keywords.every((keyword) => scrapingStatus[keyword] === "completed") && clusterId && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/cluster/${clusterId}`)}
              >
                📊 Zum Market Cluster
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </Container>
  );
}
