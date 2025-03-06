import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // Generiert eine zufällige Task-ID

const API_URL = "http://localhost:9000/api"; // Falls dein Backend lokal läuft

export const startAsinScraping = async (searchTerm: string): Promise<string> => {
  const taskId = uuidv4(); // Einzigartige ID für diesen Task generieren
  await axios.get(`${API_URL}/get-asins?search_term=${encodeURIComponent(searchTerm)}&task_id=${taskId}`);
  return taskId;
};

export const checkScrapingStatus = async (taskId: string): Promise<{ status: string; data: { first_page_products: any[] } }> => {
    const { data } = await axios.get(`http://localhost:9000/api/get-asins/status?task_id=${taskId}`);
    return data;
  };
  
