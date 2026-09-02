import { assertOk, byName } from "./http";
import type { Provider, ProviderConfig } from "./types";

interface ChatCompletion {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
}

/** Any server that speaks the OpenAI REST shape: OpenAI, OpenRouter, Groq, Mistral, Ollama, LM Studio… */
export function openai(config: ProviderConfig): Provider {
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  return {
    label: config.label,

    async listModels() {
      const res = await fetch(`${config.baseUrl}/models`, { headers });
      await assertOk(res);
      // OpenRouter and some local servers add a display `name`; OpenAI only has ids.
      const body = (await res.json()) as { data: { id: string; name?: string }[] };
      return body.data.map((m) => ({ id: m.id, name: m.name ?? m.id })).sort(byName);
    },

    async complete({ model, system, input, signal }) {
      // No temperature on purpose: reasoning models reject anything but the default.
      const res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: input },
          ],
        }),
      });
      await assertOk(res);
      const choice = ((await res.json()) as ChatCompletion).choices?.[0];
      const text = choice?.message?.content;
      if (typeof text !== "string" || !text.trim()) throw new Error("The API returned no text.");
      return { text: text.trim(), truncated: choice?.finish_reason === "length" };
    },
  };
}
