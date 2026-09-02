import { useLocalStorage } from "@raycast/utils";
import { randomUUID } from "node:crypto";
import { BUILT_IN_PROMPTS, DEFAULT_RULES, Prompt } from "./builtin-prompts";

interface Stored {
  /** User-created prompts. */
  custom: Prompt[];
  /** Instruction overrides for built-ins, by id. */
  overrides: Record<string, string>;
  /** Shared rules override; absent means the default. */
  rules?: string;
}

const KEY = "prompts";
const EMPTY: Stored = { custom: [], overrides: {} };

export interface PromptInput {
  /** Omit to create a new custom prompt. */
  id?: string;
  title: string;
  instruction: string;
}

/** Built-ins (with any edits applied) followed by custom prompts, plus the shared rules, all persisted in LocalStorage. */
export function usePrompts() {
  const { value, setValue, isLoading } = useLocalStorage<Stored>(KEY, EMPTY);
  const stored = value ?? EMPTY;

  const prompts: Prompt[] = [
    ...BUILT_IN_PROMPTS.map((p) =>
      p.id in stored.overrides ? { ...p, instruction: stored.overrides[p.id], edited: true } : p,
    ),
    ...stored.custom,
  ];
  const rules = stored.rules ?? DEFAULT_RULES;

  const update = (patch: (s: Stored) => Stored) => setValue(patch(stored));

  return {
    prompts,
    rules,
    isLoading,

    /** Creates a custom prompt (no id), updates a custom one, or overrides a built-in's instruction. */
    save: ({ id, title, instruction }: PromptInput) =>
      update((s) => {
        if (id && BUILT_IN_PROMPTS.some((p) => p.id === id)) {
          return { ...s, overrides: { ...s.overrides, [id]: instruction } };
        }
        const prompt: Prompt = { id: id ?? randomUUID(), title, instruction, builtIn: false };
        const custom = id ? s.custom.map((p) => (p.id === id ? prompt : p)) : [...s.custom, prompt];
        return { ...s, custom };
      }),

    remove: (id: string) => update((s) => ({ ...s, custom: s.custom.filter((p) => p.id !== id) })),

    /** Drops the user's edit of a built-in. */
    reset: (id: string) =>
      update((s) => {
        const overrides = { ...s.overrides };
        delete overrides[id];
        return { ...s, overrides };
      }),

    setRules: (next: string) =>
      update((s) => ({ ...s, rules: next.trim() && next.trim() !== DEFAULT_RULES ? next.trim() : undefined })),
  };
}

/** Matches a prompt by id, exact title, or a title fragment when it is unambiguous. Case-insensitive. */
export function findPrompt(prompts: Prompt[], query: string): Prompt | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const byId = prompts.find((p) => p.id.toLowerCase() === q);
  if (byId) return byId;
  const byTitle = prompts.find((p) => p.title.toLowerCase() === q);
  if (byTitle) return byTitle;
  const partial = prompts.filter((p) => p.title.toLowerCase().includes(q));
  return partial.length === 1 ? partial[0] : undefined;
}
