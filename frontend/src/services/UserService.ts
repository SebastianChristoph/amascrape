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

  static async register(
    username: string,
    email: string,
    password: string,
    passwordRepeat: string
  ): Promise<{ success: boolean; mocked_verification_link?: string; message: string }> {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, password_repeat: passwordRepeat }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, message: errorData.detail || "Registrierung fehlgeschlagen." };
      }

      const data = await response.json(); // ✅ Jetzt wird die JSON-Antwort korrekt geparsed
      return { success: true, mocked_verification_link: data.mocked_verification_link, message: data.message };
    } catch (error) {
      console.error("Fehler bei der Registrierung:", error);
      return { success: false, message: "Netzwerkfehler. Bitte versuche es erneut." };
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
