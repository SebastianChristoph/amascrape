import { formatError } from '../utils/errorFormatting';

const API_URL = "http://127.0.0.1:9000";

class VerifyService {
  static async verifyUser(token: string): Promise<{ success: boolean; username?: string; email?: string; message: string }> {
    try {
      const response = await fetch(`${API_URL}/users/verify/${token}`);

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, message: errorData.detail || "Verifizierung fehlgeschlagen." };
      }

      const data = await response.json();
      return { success: true, username: data.username, email: data.email, message: data.message };
    } catch (error) {
      console.error("[VerifyService] Verification error:", formatError(error));
      return { success: false, message: "Netzwerkfehler. Bitte versuche es erneut." };
    }
  }
}

export default VerifyService;
