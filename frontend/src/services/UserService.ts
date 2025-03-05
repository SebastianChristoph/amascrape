import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string; // Benutzername
  exp: number; // Ablaufzeitpunkt des Tokens (Unix Timestamp)
  iat?: number; // Zeitpunkt der Erstellung (optional)
  [key: string]: any; // Falls das Token weitere Felder enthält
}

class UserService {
  private static TOKEN_KEY = "token";

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

  // 📌 Prüft, ob das Token noch gültig ist
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
