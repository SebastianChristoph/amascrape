import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

import UserService from "../services/UserService";

interface User {
  id: number;
  username: string;
  email: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isProductRunning, setIsProductRunning] = useState(false);
  const [productLogs, setProductLogs] = useState<string[]>([]);
  const [isMarketRunning, setIsMarketRunning] = useState(false);
  const [marketLogs, setMarketLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkProductOrchestratorStatus();
      checkMarketOrchestratorStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isProductRunning) {
      const productLogInterval = setInterval(fetchProductLogs, 5000);
      return () => clearInterval(productLogInterval);
    }
  }, [isProductRunning]);

  useEffect(() => {
    if (isMarketRunning) {
      const marketLogInterval = setInterval(fetchMarketLogs, 5000);
      return () => clearInterval(marketLogInterval);
    }
  }, [isMarketRunning]);

  const checkProductOrchestratorStatus = async () => {
    const response = await fetch(
      "http://127.0.0.1:9000/scraping/is-product-orchestrator-running",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const data = await response.json();
    setIsProductRunning(data.running);
  };

  const checkMarketOrchestratorStatus = async () => {
    const response = await fetch(
      "http://127.0.0.1:9000/scraping/is-market-orchestrator-running",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const data = await response.json();
    setIsMarketRunning(data.running);
  };
  const fetchProductLogs = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:9000/scraping/get-product-orchestrator-logs",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!Array.isArray(data.logs)) {
        console.error(
          "Fehler: Produkt-Orchestrator-Logs sind nicht im erwarteten Array-Format!",
          data
        );
        return;
      }

      console.log("✅ Product Logs:", data.logs); // Debugging
      setProductLogs(data.logs); // Setzt nur die Product-Orchestrator-Logs
    } catch (error) {
      console.error(
        "❌ Fehler beim Abrufen der Product-Orchestrator-Logs:",
        error
      );
    }
  };

  const fetchMarketLogs = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:9000/scraping/get-market-orchestrator-logs",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!Array.isArray(data.logs)) {
        console.error(
          "Fehler: Market-Orchestrator-Logs sind nicht im erwarteten Array-Format!",
          data
        );
        return;
      }

      console.log("✅ Market Logs:", data.logs); // Debugging
      setMarketLogs(data.logs); // Setzt nur die Market-Orchestrator-Logs
    } catch (error) {
      console.error(
        "❌ Fehler beim Abrufen der Market-Orchestrator-Logs:",
        error
      );
    }
  };

  const startProductOrchestrator = async () => {
    try {
      setIsProductRunning(true);
      setProductLogs([]);
      const response = await fetch(
        "http://127.0.0.1:9000/scraping/start-product-orchestrator",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Fehler beim Starten");
    } catch (error) {
      console.error("❌ Fehler beim Starten:", error);
      alert("Fehler beim Starten des Product Orchestrators");
    }
  };

  const startMarketOrchestrator = async () => {
    try {
      setIsMarketRunning(true);
      setMarketLogs([]);
      const response = await fetch(
        "http://127.0.0.1:9000/scraping/start-market-orchestrator",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Fehler beim Starten");
    } catch (error) {
      console.error("❌ Fehler beim Starten:", error);
      alert("Fehler beim Starten des Product Orchestrators");
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://127.0.0.1:9000/users/admin/all-users",
        {
          headers: { Authorization: `Bearer ${UserService.getToken()}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Fehler: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fehler beim Abrufen der Benutzer:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    const result = await UserService.createUserAsAdmin(
      username,
      email,
      password
    );
    if (result.success) {
      fetchUsers();
      setUsername("");
      setEmail("");
      setPassword("");
    }
    alert(result.message);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const result = await UserService.deleteUser(selectedUser.id);
    if (result.success) {
      fetchUsers();
      setOpenDialog(false);
    }
    alert(result.message);
  };

  const handleAddCredits = async (userId: number) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:9000/users/admin/add-credits/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${UserService.getToken()}`,
          },
          body: JSON.stringify({ amount: 100 }),
        }
      );

      if (!response.ok) {
        throw new Error("Fehler beim Hinzufügen der Credits");
      }

      alert("100 Credits erfolgreich hinzugefügt!");
      fetchUsers(); // Aktualisiere die Benutzerliste, um die neue Credit-Anzahl anzuzeigen
    } catch (error) {
      console.error("Fehler beim Hinzufügen der Credits:", error);
      alert("Fehler beim Hinzufügen der Credits");
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>

      {/* <Accordion>
        <AccordionSummary expandIcon={<FiChevronDown />}>
          <Typography variant="h6">Product Orchestrator</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isProductRunning ? <CircularProgress size={24} /> : null}
            <Typography>
              {isProductRunning
                ? "Product Orchestrator läuft..."
                : "Product Orchestrator ist gestoppt."}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={startProductOrchestrator}
            disabled={isProductRunning}
            sx={{ mt: 2 }}
          >
            Product Orchestrator starten
          </Button>
          <Paper sx={{ mt: 2, p: 2, maxHeight: 300, overflow: "auto" }}>
            <Typography variant="h6">Product Orchestrator Logs:</Typography>
            {productLogs.length === 0 ? (
              <Typography color="textSecondary">
                Keine Logs verfügbar
              </Typography>
            ) : (
              productLogs.map((log, i) => (
                <Typography
                  key={i}
                  variant="body2"
                  sx={{ fontFamily: "monospace" }}
                >
                  {log}
                </Typography>
              ))
            )}
          </Paper>
        </AccordionDetails>
      </Accordion> */}

      {/* ✅ Market Orchestrator */}
      {/* <Accordion>
        <AccordionSummary expandIcon={<FiChevronDown />}>
          <Typography variant="h6">Market Orchestrator</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isMarketRunning ? <CircularProgress size={24} /> : null}
            <Typography>
              {isMarketRunning
                ? "Market Orchestrator läuft..."
                : "Market Orchestrator ist gestoppt."}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={startMarketOrchestrator}
            disabled={isMarketRunning}
            sx={{ mt: 2 }}
          >
            Market Orchestrator starten
          </Button>
          <Paper sx={{ mt: 2, p: 2, maxHeight: 300, overflow: "auto" }}>
            <Typography variant="h6">Market Orchestrator Logs:</Typography>
            {marketLogs.length === 0 ? (
              <Typography color="textSecondary">
                Keine Logs verfügbar
              </Typography>
            ) : (
              marketLogs.map((log, i) => (
                <Typography
                  key={i}
                  variant="body2"
                  sx={{ fontFamily: "monospace" }}
                >
                  {log}
                </Typography>
              ))
            )}
          </Paper>
        </AccordionDetails>
      </Accordion> */}

      {/* ✅ Benutzer hinzufügen */}
      <Accordion>
        <AccordionSummary expandIcon={<FiChevronDown />}>
          <Typography variant="h6">Benutzer hinzufügen</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Username"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleCreateUser}>
            Benutzer erstellen
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* ✅ Benutzer löschen */}
      <Accordion>
        <AccordionSummary expandIcon={<FiChevronDown />}>
          <Typography variant="h6">Benutzer verwalten</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="success"
                        sx={{ mr: 1 }}
                        onClick={() => handleAddCredits(user.id)}
                      >
                        +100 Credits
                      </Button>
                      <Button
                        color="error"
                        onClick={() => {
                          setSelectedUser(user);
                          setOpenDialog(true);
                        }}
                      >
                        Löschen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* ✅ Bestätigungsdialog für Löschung */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Benutzer löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sind Sie sicher, dass Sie {selectedUser?.username} löschen möchten?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button color="error" onClick={handleDeleteUser}>
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
