const API_URL = "http://127.0.0.1:9000";

class LoginService {
  private static TOKEN_KEY = "token";

  // 📌 Login-Funktion mit API-Request
  static async authenticate(username: string, password: string): Promise<boolean> {
      try {
        console.log("try to authenticate with", username   , password);
      const response = await fetch(`${API_URL}/users/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Login fehlgeschlagen");
      }

      const data = await response.json();
      localStorage.setItem(this.TOKEN_KEY, data.access_token);
      return true;
    } catch (error) {
      console.error("Fehler beim Login:", error);
      return false;
    }
  }

  // 📌 Logout-Funktion (Token entfernen)
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

export default LoginService;
