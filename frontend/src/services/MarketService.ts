const API_URL = "http://127.0.0.1:9000";

class MarketService {
  private static TOKEN_KEY = "token";

  // 📌 Market Cluster aktualisieren (nur Titel)
  static async updateMarketCluster(
    clusterId: number,
    updatedData: { title: string }
  ) {
    try {
      const response = await fetch(
        `${API_URL}/market-clusters/update/${clusterId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(this.TOKEN_KEY)}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok)
        throw new Error("Fehler beim Aktualisieren des Market Clusters.");
      return { success: true, data: await response.json() };
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Market Clusters:", error);
      return { success: false };
    }
  }

  // 📌 Market Cluster löschen
  static async deleteMarketCluster(clusterId: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_URL}/market-clusters/delete/${clusterId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(this.TOKEN_KEY)}`,
          },
        }
      );

      if (!response.ok)
        throw new Error("Fehler beim Löschen des Market Clusters.");
      return true;
    } catch (error) {
      console.error("Fehler beim Löschen des Market Clusters:", error);
      return false;
    }
  }

  // 📌 Alle Market-Cluster des eingeloggten Users abrufen
  static async GetMarketClusters(): Promise<any> {
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
  static async getMarketClusterDetails(clusterId: number): Promise<any> {
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
        throw new Error(
          `Fehler beim Abrufen der Details für Market-Cluster ${clusterId}.`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Fehler beim Abrufen der Market-Cluster-Details:", error);
      return null;
    }
  }

  static async startScrapingProcess(newClusterData: {
    keywords: string[];
    clusterName: string | null;
  }): Promise<{ success: boolean }> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) throw new Error("Kein Token vorhanden. Bitte einloggen.");

      const response = await fetch(
        `${API_URL}/api/start-firstpage-scraping-process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newClusterData),
        }
      );

      if (!response.ok)
        throw new Error("Fehler beim Starten des Scraping-Prozesses.");

      const data = await response.json();
      return { success: data.success ?? false };
    } catch (error) {
      console.error("Fehler beim Starten des Scraping-Prozesses:", error);
      return { success: false };
    }
  }

  static async getActiveScrapingCluster(): Promise<{
    clustername: string;
    status: string;
    keywords: { [keyword: string]: string };
  } | null> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) throw new Error("Kein Token vorhanden. Bitte einloggen.");

      const response = await fetch(`${API_URL}/api/get-loading-clusters`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error("Fehler beim Abrufen des aktiven Scraping-Prozesses.");

      const data = await response.json();

      // ✅ Falls kein aktiver Cluster existiert, `null` zurückgeben
      if (!data || !data.clustername) {
        console.log("[MarketService] Kein aktiver Scraping-Prozess gefunden.");
        return null;
      }

      return data; // ✅ Falls ein aktiver Cluster existiert, diesen zurückgeben
    } catch (error) {
      console.error(
        "Fehler beim Abrufen des aktiven Scraping-Prozesses:",
        error
      );
      return null;
    }
  }
}

export default MarketService;
