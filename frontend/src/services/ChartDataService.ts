const API_URL = "http://127.0.0.1:9000/chartdata";

interface LineChartData {
  x_axis: number[];
  series: { name: string; data: number[] }[];
}

class ChartDataService {
  private static TOKEN_KEY = "token";   

  static async GetLineChartData(): Promise<LineChartData | null> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(`${API_URL}/get-line-chart-data`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der LineChart-Daten.");
      }

      return await response.json();
    } catch (error) {
      console.error("Fehler beim Abrufen der LineChart-Daten:", error);
      return null;
    }
  }

  static async GetSparkLineData(): Promise<number[] | null> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(`${API_URL}/get-spark-line-data`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der SparkLine-Daten.");
      }

      const json = await response.json();
      return json.data;
    } catch (error) {
      console.error("Fehler beim Abrufen der SparkLine-Daten:", error);
      return null;
    }
  }

  static async GetStackedChartData(): Promise<any> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(`${API_URL}/get-stacked-chart-data`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Stacked-Chart-Daten.");
      }

      return await response.json();
    } catch (error) {
      console.error("Fehler beim Abrufen der Stacked-Chart-Daten:", error);
      return null;
    }
  }
  static async GetBarChartData(): Promise<any> {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        throw new Error("Kein Token vorhanden. Bitte einloggen.");
      }

      const response = await fetch(`${API_URL}/get-bar-chart-data`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Fehler beim Abrufen der Bar-Chart-Daten.");
      }

      return await response.json();
    } catch (error) {
      console.error("Fehler beim Abrufen der Bar-Chart-Daten:", error);
      return null;
    }
  }
}

export default ChartDataService;
