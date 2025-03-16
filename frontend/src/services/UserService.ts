import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string; // Benutzername
  exp: number; // Ablaufzeitpunkt des Tokens (Unix Timestamp)
  iat?: number; // Zeitpunkt der Erstellung (optional)
  [key: string]: any; // Falls das Token weitere Felder enthält
}

const API_URL = "http://127.0.0.1:9000"; // Backend-URL

class UserService {
  private static TOKEN_KEY = "token";

  static async register(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registrierung fehlgeschlagen");
      }

      return true;
    } catch (error) {
      console.error("Fehler bei der Registrierung:", error);
      return false;
    }
  }


  // 📌 Holt das JWT-Token aus localStorage
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // 📌 Dekodiert das JWT-Token und gibt die User-Daten zurück
  static getUser(): DecodedToken | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error("Fehler beim Dekodieren des Tokens:", error);
      return null;
    }
  }

  // 📌 Prüft, ob das Token noch gültig ist (läuft um 23:59:59 ab)
  static isAuthenticated(): boolean {
    const user = this.getUser();
    if (!user || !user.exp) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return user.exp > currentTime; // Token ist gültig, wenn es noch nicht abgelaufen ist
  }

  // 📌 Entfernt das Token (Logout)
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

export default UserService;
