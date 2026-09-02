import { assertOk, byName } from "./http";
import type { Provider, ProviderConfig } from "./types";

// Required by the Messages API. 4096 is accepted by every current model and is ~3000 words,
// more than any of the prompts should produce.
const MAX_TOKENS = 4096;

interface Message {
  content?: { type: string; text?: string }[];
  stop_reason?: string;
}

export function anthropic(config: ProviderConfig): Provider {
  const headers = {
    "x-api-key": config.apiKey,
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
  };

  return {
    label: config.label,

    async listModels() {
      // Default page size is 20; 1000 is the max and more than enough to skip paging.
      const res = await fetch(`${config.baseUrl}/models?limit=1000`, { headers });
      await assertOk(res);
      const body = (await res.json()) as { data: { id: string; display_name?: string }[] };
      return body.data.map((m) => ({ id: m.id, name: m.display_name ?? m.id })).sort(byName);
    },

    async complete({ model, system, input, signal }) {
      const res = await fetch(`${config.baseUrl}/messages`, {
        method: "POST",
        headers,
        signal,
        body: JSON.stringify({
          model,
          system,
          max_tokens: MAX_TOKENS,
          messages: [{ role: "user", content: input }],
        }),
      });
      await assertOk(res);
      const body = (await res.json()) as Message;
      const text = (body.content ?? [])
        .filter((block) => block.type === "text")
        .map((block) => block.text ?? "")
        .join("")
        .trim();
      if (!text) throw new Error("The API returned no text.");
      return { text, truncated: body.stop_reason === "max_tokens" };
    },
  };
}
