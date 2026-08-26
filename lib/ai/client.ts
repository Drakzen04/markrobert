const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1/chat/completions";

type ChatMessage = { role: "user" | "system"; content: string };

async function callNvidia(apiKey: string | undefined, model: string, messages: ChatMessage[], maxTokens: number, temperature = 0.3): Promise<string | null> {
  if (!apiKey) return null;
  try {
    const res = await fetch(NVIDIA_BASE, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        top_p: 0.9,
        max_tokens: maxTokens,
        stream: false
      }),
      cache: "no-store"
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export { callNvidia };
