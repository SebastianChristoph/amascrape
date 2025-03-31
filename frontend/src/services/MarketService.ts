import { formatError } from "../utils/errorFormatting";

const API_URL = "http://127.0.0.1:9000";

class MarketService {
  private static TOKEN_KEY = "token";

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
      console.error(
        "[MarketService] Update cluster error:",
        formatError(error)
      );
      return { success: false };
    }
  }

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
      console.error(
        "[MarketService] Delete cluster error:",
        formatError(error)
      );
      return false;
    }
  }

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
      console.error("[MarketService] Get clusters error:", formatError(error));
      return null;
    }
  }

  static async getDashboardOverview(): Promise<any> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("No token found. Please login.");
      }

      const response = await fetch(
        `${API_URL}/market-clusters/dashboard-overview`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error fetching dashboard overview data: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(
        "[MarketService] Dashboard overview error:",
        formatError(error)
      );
      return {
        total_revenue: 0,
        total_markets: 0,
        total_unique_products: 0,
        revenue_development: new Array(30).fill(0),
      };
    }
  }

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
      console.error(
        "[MarketService] Cluster details error:",
        formatError(error)
      );
      return null;
    }
  }

  static async startScrapingProcess(newClusterData: {
    keywords: string[];
    clusterName: string | null;
    clusterType: string | "dynamic";
  }): Promise<{ success: boolean }> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) throw new Error("Kein Token vorhanden. Bitte einloggen.");

      const response = await fetch(
        `${API_URL}/scraping/start-firstpage-scraping-process`,
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
      console.error(
        "[MarketService] Start scraping error:",
        formatError(error)
      );
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

      const response = await fetch(`${API_URL}/scraping/get-loading-clusters`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error("Fehler beim Abrufen des aktiven Scraping-Prozesses.");

      const data = await response.json();

      if (!data || !data.clustername) {
        return null;
      }

      return data;
    } catch (error) {
      console.error(
        "[MarketService] Active cluster error:",
        formatError(error)
      );
      return null;
    }
  }

  static async getProductChanges(asin: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_URL}/products/product-changes/${asin}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Produktänderungen.");
      }

      return await response.json();
    } catch (error) {
      console.error(
        "[MarketService] Product changes error:",
        formatError(error)
      );
      return [];
    }
  }

  static async addAsinToMarket(
    asin: string,
    marketId: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const response = await fetch(`${API_URL}/market-clusters/add-asin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ asin, market_id: marketId }),
      });
  
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to add ASIN: ${errText}`);
      }
  
      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      console.error("[MarketService] Add ASIN error:", formatError(error));
      return { success: false, message: formatError(error) };
    }
  }
  
}

export default MarketService;
