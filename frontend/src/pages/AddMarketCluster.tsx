import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Typography, Box, Chip, IconButton, Stack } from "@mui/material";
import { MdAdd, MdClose } from "react-icons/md";
import MarketService from "../services/MarketService";
import { useSnackbar } from "../providers/SnackbarProvider"; // ✅ Snackbar für Benutzer-Feedback

export default function AddMarketCluster() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar(); // ✅ Snackbar für Feedback nutzen
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]); // ✅ Liste für Keywords

  // ✅ Keyword zur Liste hinzufügen (keine Duplikate erlaubt)
  const handleAddKeyword = () => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) return; // Leere Eingaben verhindern

    if (keywords.includes(trimmedKeyword)) {
      showSnackbar("Dieses Keyword wurde bereits hinzugefügt!", "warning"); // ✅ Snackbar-Warnung
      return;
    }

    if (keywords.length < 5) {
      setKeywords([...keywords, trimmedKeyword]);
      setKeyword(""); // Eingabefeld zurücksetzen
    }
  };

  // ✅ Keyword entfernen
  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  // 📌 Market Cluster mit Keywords erstellen
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (keywords.length === 0) {
      showSnackbar("Bitte mindestens ein Keyword hinzufügen.", "error"); // ✅ Snackbar-Warnung
      return;
    }

    // ✅ API-Aufruf mit mehreren Keywords
    const response = await MarketService.createMarketCluster({ title, keywords });

    if (response.success) {
      navigate("/dashboard", { state: { addedClusterId: response.data.id } }); // ✅ Animation triggern
    } else {
      showSnackbar("Fehler beim Erstellen des Market Clusters", "error"); // ✅ Fehleranzeige
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Add Market Cluster
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Cluster Title */}
        <TextField
          fullWidth
          label="Cluster Title"
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 2 }}
        />

        {/* Keyword Eingabe */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="Market Keyword"
            variant="outlined"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={keywords.length >= 5}
          />
          <Button
            variant="contained"
            startIcon={<MdAdd />}
            onClick={handleAddKeyword}
            disabled={keywords.length >= 5}
          >
            Add
          </Button>
        </Box>

        {/* Liste der Keywords */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 2 }}>
          {keywords.map((kw, index) => (
            <Chip
              key={index}
              label={kw}
              onDelete={() => handleRemoveKeyword(index)}
              deleteIcon={<MdClose />}
            />
          ))}
        </Stack>

        <Button type="submit" variant="contained" color="primary" fullWidth>
          Create Market Cluster
        </Button>
      </form>
    </Container>
  );
}
