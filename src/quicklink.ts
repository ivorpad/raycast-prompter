import { Action, environment, Icon } from "@raycast/api";
import { Prompt } from "./builtin-prompts";

type Quicklink = Action.CreateQuicklink.Props["quicklink"];

/** Deeplink that runs the prompt on the current selection or clipboard. */
export function promptDeeplink(prompt: Prompt): string {
  const args = encodeURIComponent(JSON.stringify({ prompt: prompt.id }));
  return `raycast://extensions/${environment.ownerOrAuthorName}/${environment.extensionName}/prompts?arguments=${args}`;
}

/**
 * Raycast commands are fixed in the manifest, so a custom prompt can't become one. A Quicklink
 * to its deeplink is the next best thing: it shows up in root search under the prompt's name
 * and can have an alias and a hotkey like any command.
 */
export function promptQuicklink(prompt: Prompt): Quicklink {
  return { name: prompt.title, link: promptDeeplink(prompt), icon: Icon.Pencil };
}
