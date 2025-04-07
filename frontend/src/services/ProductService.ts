import { formatError } from "../utils/errorFormatting";

const API_URL = "http://127.0.0.1:9000";

class ProductService {
  private static TOKEN_KEY = "token";

  static async getProductChartData(asin: string): Promise<{
    x_axis: string[];
    series: { name: string; data: number[] }[];
  } | null> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(
        `${API_URL}/products/get-product-chart-data/${asin}`,
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
          `Fehler beim Abrufen der Chart-Daten: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[ProductService] Chart Data Error:", formatError(error));
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
  
}

export default ProductService;
