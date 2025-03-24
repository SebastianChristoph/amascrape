import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
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
import { Link } from "react-router-dom";
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

  // ✅ NEU: Für Logs
  const [logFiles, setLogFiles] = useState<string[]>([]);
  const [selectedLogContent, setSelectedLogContent] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchUsers();
    fetchLogFiles();
  }, []);

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

  // ✅ NEU: Logs holen
  const fetchLogFiles = async () => {
    try {
      const res = await fetch("http://127.0.0.1:9000/scraping/logs", {
        headers: { Authorization: `Bearer ${UserService.getToken()}` },
      });
      const data = await res.json();
      setLogFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fehler beim Laden der Logs:", error);
    }
  };

  const fetchLogContent = async (filename: string) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:9000/scraping/logs/${filename}`,
        {
          headers: { Authorization: `Bearer ${UserService.getToken()}` },
        }
      );
      const text = await res.text();
      setSelectedLogContent(`📄 ${filename}\n\n` + text);
    } catch (error) {
      console.error("Fehler beim Laden der Logdatei:", error);
      setSelectedLogContent("Fehler beim Laden.");
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
    const result = await UserService.deleteUserAsAdmin(selectedUser.id);
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
      fetchUsers();
    } catch (error) {
      console.error("Fehler beim Hinzufügen der Credits:", error);
      alert("Fehler beim Hinzufügen der Credits");
    }
  };

  // 📁 Trenne fails- & scraping-Logs
  const failLogs = logFiles.filter((f) => f.startsWith("fails-"));
  const scrapeLogs = logFiles.filter((f) => f.startsWith("scraping-"));

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>

      {/* Benutzer hinzufügen */}
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

      {/* Benutzer verwalten */}
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

      {/* Fail Logs */}
      <Accordion>
        <AccordionSummary expandIcon={<FiChevronDown />}>
          <Typography variant="h6">❌ Fehlgeschlagene Produkte</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Container>
            <ul>
              {failLogs.map((file) => (
                <li key={file}>
                  <Link
                    to={`/admin/logs/${file}`}
                    style={{ textDecoration: "none" }}
                  >
                    {file}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </AccordionDetails>
      </Accordion>

      {/* Scraping Logs */}
      <Accordion>
        <AccordionSummary expandIcon={<FiChevronDown />}>
          <Typography variant="h6">📜 Scraping-Logs</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Container>
            <ul>
              {scrapeLogs.map((file) => (
                <li key={file}>
                  <Link
                    to={`/admin/logs/${file}`}
                    style={{ textDecoration: "none" }}
                  >
                    {file}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </AccordionDetails>
      </Accordion>

      {/* Bestätigungsdialog */}
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
