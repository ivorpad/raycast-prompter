import { getPreferenceValues } from "@raycast/api";
import { anthropic } from "./anthropic";
import { ConfigError } from "./http";
import { openai } from "./openai";
import type { Provider } from "./types";

export type { CompleteResult, Model, Provider } from "./types";
export { needsPreferences } from "./http";

type ProviderId = Preferences["provider"];

interface Preset {
  label: string;
  api: typeof openai | typeof anthropic;
  /** Absent means the user has to set Base URL. */
  baseUrl?: string;
  /** Keys from this vendor start with this; used to catch a key pasted under the wrong provider. */
  keyPrefix?: string;
}

const PRESETS: Record<ProviderId, Preset> = {
  openai: { label: "OpenAI", api: openai, baseUrl: "https://api.openai.com/v1" },
  openrouter: { label: "OpenRouter", api: openai, baseUrl: "https://openrouter.ai/api/v1", keyPrefix: "sk-or-" },
  anthropic: { label: "Anthropic", api: anthropic, baseUrl: "https://api.anthropic.com/v1", keyPrefix: "sk-ant-" },
  custom: { label: "OpenAI-compatible", api: openai },
};

/** Builds the provider from extension preferences. Cheap; call it where you need it. */
export function getProvider(): Provider {
  const prefs = getPreferenceValues<Preferences>();
  const preset = PRESETS[prefs.provider];
  const apiKey = prefs.apiKey.trim();
  const baseUrl = (prefs.baseUrl?.trim() || preset.baseUrl || "").replace(/\/+$/, "");

  const mismatch = Object.entries(PRESETS).find(
    ([id, p]) => id !== prefs.provider && p.keyPrefix && apiKey.startsWith(p.keyPrefix),
  );
  if (mismatch) {
    return unconfigured(
      preset.label,
      `That key looks like it belongs to ${mismatch[1].label}. Set Provider to ${mismatch[1].label}.`,
    );
  }
  if (!baseUrl) return unconfigured(preset.label, "Set the Base URL of your server in the extension preferences.");

  return preset.api({ label: preset.label, apiKey, baseUrl });
}

/** A provider whose every call fails with the same, actionable message. Keeps render paths free of throws. */
function unconfigured(label: string, message: string): Provider {
  const fail = () => Promise.reject(new ConfigError(message));
  return { label, listModels: fail, complete: fail };
}
