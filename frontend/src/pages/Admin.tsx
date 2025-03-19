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
  Typography
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
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    checkOrchestratorStatus();
    fetchLogs();

    const interval = setInterval(() => {
      checkOrchestratorStatus();
      fetchLogs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkOrchestratorStatus = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:9000/scraping/is-product-orchestrator-running",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      setIsRunning(data.running);
    } catch (error) {
      console.error("Fehler beim Abrufen des Orchestrator-Status:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:9000/scraping/get-product-orchestrator-logs",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (error) {
      console.error("Fehler beim Abrufen der Logs:", error);
    }
  };

  const startProductOrchestrator = async () => {
    try {
      setIsRunning(true);
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

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>

      {/* ✅ Product Orchestrator */}
      <Accordion>
        <AccordionSummary expandIcon={<FiChevronDown />}>
          <Typography variant="h6">Product Orchestrator</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isRunning ? (
              <>
                <CircularProgress size={24} color="primary" />
                <Typography color="primary">
                  Product Orchestrator läuft...
                </Typography>
              </>
            ) : (
              <Typography color="green">
                Product Orchestrator ist gestoppt.
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={startProductOrchestrator}
            disabled={isRunning || loading}
            sx={{ mt: 2 }}
          >
            {loading ? "Starte..." : "Product Orchestrator starten"}
          </Button>

          <Paper
            sx={{
              mt: 4,
              p: 2,
              maxHeight: 300,
              overflow: "auto",
              backgroundColor: "#f4f4f4",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Logs:
            </Typography>
            {logs.length === 0 ? (
              <Typography color="textSecondary">
                Keine Logs verfügbar
              </Typography>
            ) : (
              logs.map((log, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{ fontFamily: "monospace" }}
                >
                  {log}
                </Typography>
              ))
            )}
          </Paper>
        </AccordionDetails>
      </Accordion>

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
          <Typography variant="h6">Benutzer löschen</Typography>
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
