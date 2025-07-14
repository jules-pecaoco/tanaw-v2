export async function sendExpoNotification(tokens: string[], title: string, body: string, data: Record<string, any> = {}): Promise<boolean> {
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data
  }));

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  return response.ok;
}
