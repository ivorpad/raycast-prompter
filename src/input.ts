import { Clipboard, getSelectedText } from "@raycast/api";

export type InputSource = "typed" | "selection" | "clipboard";

export interface Input {
  text: string;
  source: InputSource;
}

export const sourceLabel: Record<InputSource, string> = {
  typed: "Typed",
  selection: "Selection",
  clipboard: "Clipboard",
};

/** Text typed after the command wins; then the selection in the frontmost app; then the clipboard. */
export async function getInput(typed?: string): Promise<Input> {
  const typedText = typed?.trim();
  if (typedText) return { text: typedText, source: "typed" };

  try {
    const selected = (await getSelectedText()).trim();
    if (selected) return { text: selected, source: "selection" };
  } catch {
    // Nothing selected, or the frontmost app does not expose its selection.
  }

  const clipboard = (await Clipboard.readText())?.trim();
  if (clipboard) return { text: clipboard, source: "clipboard" };

  throw new Error("Nothing to rewrite. Select some text, copy it, or type it after the command.");
}
