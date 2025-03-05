import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../providers/SnackbarProvider";
import LoginService from "../services/LoginService";

export default function Login() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar(); // Snackbar Hook nutzen
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await LoginService.authenticate(username, password);
    if (success) {
      navigate("/dashboard");
    } else {
      showSnackbar("Login fehlgeschlagen. Bitte überprüfe deine Anmeldedaten.", "error");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="text" 
        placeholder="Username" 
        value={username} 
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input 
        type="password" 
        placeholder="Password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
