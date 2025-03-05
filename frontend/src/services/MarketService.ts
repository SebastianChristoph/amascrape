const API_URL = "http://127.0.0.1:9000";

class MarketService {
  private static TOKEN_KEY = "token";

  // 📌 Funktion zum Abrufen aller Market-Cluster des eingeloggten Users
  static async get_market_cluster(): Promise<any> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(`${API_URL}/users/market-clusters`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Market-Cluster.");
      }

      return await response.json(); // JSON zurückgeben
    } catch (error) {
      console.error("Fehler beim Abrufen der Market-Cluster:", error);
      return null;
    }
  }

  // 📌 Funktion zum Abrufen eines spezifischen Market-Clusters mit den neuesten MarketChanges
  static async get_market_cluster_details(clusterId: number): Promise<any> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(`${API_URL}/users/market-clusters/${clusterId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Fehler beim Abrufen der Details für Market-Cluster ${clusterId}.`);
      }

      return await response.json();
    } catch (error) {
      console.error("Fehler beim Abrufen der Market-Cluster-Details:", error);
      return null;
    }
  }

  // 📌 Neue Funktion zum Abrufen eines einzelnen Marktes mit dem neuesten MarketChange
  static async get_market(marketId: number): Promise<any> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(`${API_URL}/markets/${marketId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Fehler beim Abrufen des Marktes ${marketId}.`);
      }

      return await response.json();
    } catch (error) {
      console.error("Fehler beim Abrufen des Marktes:", error);
      return null;
    }
  }
}

export default MarketService;
