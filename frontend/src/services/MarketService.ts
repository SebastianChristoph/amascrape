const API_URL = "http://127.0.0.1:9000";

class MarketService {
  private static TOKEN_KEY = "token";

  // 📌 Neues Market Cluster erstellen mit mehreren Keywords
  static async createMarketCluster(clusterData: { title: string; keywords: string[] }) {
    try {
      const response = await fetch(`${API_URL}/market-clusters/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(this.TOKEN_KEY)}`,
        },
        body: JSON.stringify(clusterData),
      });

      if (!response.ok) throw new Error("Fehler beim Erstellen des Market Clusters.");
      return { success: true, data: await response.json() };
    } catch (error) {
      console.error("Fehler beim Erstellen des Market Clusters:", error);
      return { success: false };
    }
  }

  // 📌 Market Cluster aktualisieren (nur Titel)
  static async updateMarketCluster(clusterId: number, updatedData: { title: string }) {
    try {
      const response = await fetch(`${API_URL}/market-clusters/update/${clusterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(this.TOKEN_KEY)}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error("Fehler beim Aktualisieren des Market Clusters.");
      return { success: true, data: await response.json() };
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Market Clusters:", error);
      return { success: false };
    }
  }

  // 📌 Market Cluster löschen
  static async deleteMarketCluster(clusterId: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/market-clusters/delete/${clusterId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem(this.TOKEN_KEY)}`,
        },
      });

      if (!response.ok) throw new Error("Fehler beim Löschen des Market Clusters.");
      return true;
    } catch (error) {
      console.error("Fehler beim Löschen des Market Clusters:", error);
      return false;
    }
  }

  // 📌 Alle Market-Cluster des eingeloggten Users abrufen
  static async get_market_cluster(): Promise<any> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(`${API_URL}/market-clusters`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Market-Cluster.");
      }

      return await response.json();
    } catch (error) {
      console.error("Fehler beim Abrufen der Market-Cluster:", error);
      return null;
    }
  }

  // 📌 Einzelnes Market-Cluster mit MarketChanges abrufen
  static async get_market_cluster_details(clusterId: number): Promise<any> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(`${API_URL}/market-clusters/${clusterId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
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

  // 📌 Einzelnen Markt abrufen
  static async get_market(marketId: number): Promise<any> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(`${API_URL}/markets/${marketId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
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

  // 📌 Scraping-Task für ein Keyword starten
  static async startAsinScraping(searchTerm: string, taskId: string): Promise<string> {
    try {
      const response = await fetch(`${API_URL}/api/get-asins?search_term=${encodeURIComponent(searchTerm)}&task_id=${taskId}`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Fehler beim Starten des Scraping-Tasks.");
      return taskId;
    } catch (error) {
      console.error("Fehler beim Starten des Scraping-Tasks:", error);
      return "";
    }
  }

  static async checkScrapingStatus(taskId: string): Promise<{ status: string; data?: { first_page_products: any[] } }> {
    try {
      const response = await fetch(`http://127.0.0.1:9000/api/get-asins/status?task_id=${taskId}`);
      const data = await response.json();
  
      console.log(`🔍 [Scraping Status] Task ${taskId}:`, data); // ✅ DEBUG LOG
  
      return data;
    } catch (error) {
      console.error("❌ Fehler beim Abrufen des Scraping-Status:", error);
      return { status: "error" };
    }
  }
  
}

export default MarketService;
