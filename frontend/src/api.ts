const API_URL = "http://127.0.0.1:9000";

export async function login(username: string, password: string) {
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

  return response.json();
}
