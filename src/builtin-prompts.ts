export interface Prompt {
  id: string;
  title: string;
  /** What the model is asked to do with the text. */
  instruction: string;
  /** Shipped with the extension: has its own command, can be edited and reset, not deleted. */
  builtIn: boolean;
  /** Built-in whose instruction the user changed. */
  edited?: boolean;
}

// Shared rules every prompt gets. Order matters: the model sees these first. Editable from the Prompts command.
export const DEFAULT_RULES = [
  "You rewrite text. Reply with the rewritten text only: no preamble, no explanation, no quotes or code fences around it.",
  "Keep the original language. Keep the meaning and the formatting (line breaks, lists, links) unless the task says otherwise.",
].join("\n");

export const BUILT_IN_PROMPTS: Prompt[] = [
  {
    id: "fix-errors",
    title: "Fix Errors",
    instruction: "Fix spelling, grammar and punctuation. Change nothing else: keep the wording, tone and length.",
    builtIn: true,
  },
  {
    id: "make-shorter",
    title: "Make Shorter",
    instruction:
      "Make it shorter. Cut filler and repetition, keep every point that carries information. Aim for about half the length.",
    builtIn: true,
  },
  {
    id: "make-longer",
    title: "Make Longer",
    instruction:
      "Make it longer. Add detail and context to the points already there. Do not invent facts, names or numbers.",
    builtIn: true,
  },
  {
    id: "more-professional",
    title: "More Professional",
    instruction:
      "Rewrite in a professional register: neutral, clear, no slang, no exclamation marks. Direct, not stiff.",
    builtIn: true,
  },
  {
    id: "more-casual",
    title: "More Casual",
    instruction:
      "Rewrite in a casual, friendly register, like a message to a colleague you know well. Contractions are fine.",
    builtIn: true,
  },
  {
    id: "for-slack",
    title: "For Slack",
    instruction: [
      "Reformat as a Slack message using Slack mrkdwn: *bold*, _italic_, `code`, • bullets.",
      "No headings, no tables, no markdown links (use bare URLs or <url|text>). Short paragraphs; lead with the point.",
    ].join(" "),
    builtIn: true,
  },
];

export function systemPrompt(prompt: Prompt, rules: string): string {
  return `${rules.trim()}\n\nTask: ${prompt.instruction.trim()}`;
}
