import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  getPreferenceValues,
  Icon,
  Keyboard,
  launchCommand,
  LaunchType,
  openExtensionPreferences,
  PopToRootType,
  showHUD,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { useRef, useState } from "react";
import { systemPrompt } from "./builtin-prompts";
import { getInput, sourceLabel } from "./input";
import { CompleteResult, getProvider, needsPreferences } from "./llm";
import { asMarkdown, wordCount } from "./markdown";
import { useModel } from "./model";
import { ModelList } from "./model-list";
import { usePrompts } from "./prompt-store";

interface Props {
  promptId: string;
  /** Text typed after the command in Raycast, if any. */
  text?: string;
}

/** Shared body of every prompt command: read input, run the prompt, deliver the result. */
export function Transform({ promptId, text }: Props) {
  const { output, autoCopy } = getPreferenceValues<Preferences>();
  const { model, setModel, isLoading: loadingModel } = useModel();
  const store = usePrompts();
  const prompt = store.prompts.find((p) => p.id === promptId);
  const title = prompt?.title ?? "Prompt";
  const { pop } = useNavigation();
  const [showDetails, setShowDetails] = useState(false);
  const abortable = useRef<AbortController | null>(null);

  // Read the input once, before the model is known, so the preview can show it while waiting.
  const input = usePromise(getInput, [text], {
    onError: async (e) => {
      await showFailureToast(e, { title: "No input" });
    },
  });

  const completion = usePromise(
    (model: string, input: string, system: string) =>
      getProvider().complete({ model, system, input, signal: abortable.current?.signal }),
    [model ?? "", input.data?.text ?? "", prompt ? systemPrompt(prompt, store.rules) : ""],
    {
      execute: Boolean(model && input.data && prompt),
      abortable,
      onData: (result) => deliver(result, output, autoCopy),
      onError: async (e) => {
        await showFailureToast(e, {
          title: `${title} failed`,
          primaryAction: needsPreferences(e)
            ? { title: "Open Extension Preferences", onAction: () => openExtensionPreferences() }
            : undefined,
        });
      },
    },
  );

  const selectModel = async (id: string) => {
    await setModel(id);
    pop();
  };

  if (!store.isLoading && !prompt) return <MissingPrompt />;
  if (!loadingModel && !model) return <NoModel onSelect={selectModel} />;

  const result = completion.data?.text;
  const markdown = completion.error
    ? `**${title} failed.** ${completion.error.message}`
    : input.error
      ? input.error.message
      : result
        ? asMarkdown(result)
        : input.data
          ? `_Original, rewriting…_\n\n${asMarkdown(input.data.text)}`
          : "";

  return (
    <Detail
      isLoading={loadingModel || store.isLoading || input.isLoading || completion.isLoading}
      navigationTitle={input.data ? `${title} · ${sourceLabel[input.data.source]}` : title}
      markdown={markdown}
      metadata={
        showDetails && (
          <Detail.Metadata>
            <Detail.Metadata.Label title="Prompt" text={prompt?.edited ? `${title} (edited)` : title} />
            <Detail.Metadata.Label title="Model" text={model ?? "None"} />
            <Detail.Metadata.Label title="Source" text={input.data ? sourceLabel[input.data.source] : "Reading…"} />
            <Detail.Metadata.Label title="Words" text={`${wordCount(input.data?.text)} → ${wordCount(result)}`} />
          </Detail.Metadata>
        )
      }
      actions={
        <ActionPanel>
          {result && (
            <ActionPanel.Section>
              <Action.Paste content={result} />
              <Action.CopyToClipboard content={result} />
            </ActionPanel.Section>
          )}
          <ActionPanel.Section>
            <Action
              title="Retry"
              icon={Icon.ArrowClockwise}
              shortcut={Keyboard.Shortcut.Common.Refresh}
              onAction={() => (input.error ? input.revalidate() : completion.revalidate())}
            />
            <Action.Push
              title="Change Model"
              icon={Icon.List}
              shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
              target={<ModelList onSelect={selectModel} />}
            />
            <Action
              title={showDetails ? "Hide Details" : "Show Details"}
              icon={Icon.Sidebar}
              shortcut={{ modifiers: ["cmd"], key: "i" }}
              onAction={() => setShowDetails((v) => !v)}
            />
            <OpenPreferencesAction />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

/** What happens once the rewritten text arrives, per the Output and Preview preferences. */
async function deliver({ text, truncated }: CompleteResult, output: Preferences["output"], autoCopy: boolean) {
  const note = truncated ? " (output was cut off)" : "";
  switch (output) {
    case "paste":
      await Clipboard.paste(text);
      await showHUD(`Pasted${note}`, { popToRootType: PopToRootType.Immediate });
      break;
    case "copy":
      await Clipboard.copy(text);
      await showHUD(`Copied${note}`, { popToRootType: PopToRootType.Immediate });
      break;
    default:
      if (autoCopy) await Clipboard.copy(text);
      if (truncated) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Output was cut off",
          message: `The model hit its output limit; the text is incomplete${autoCopy ? " (copied anyway)" : ""}.`,
        });
      } else if (autoCopy) {
        await showToast({ style: Toast.Style.Success, title: "Copied to clipboard" });
      }
  }
}

function NoModel({ onSelect }: { onSelect: (id: string) => Promise<void> }) {
  return (
    <Detail
      markdown={
        "No model selected yet.\n\nPick one from the list your provider exposes; the choice is remembered per provider."
      }
      actions={
        <ActionPanel>
          <Action.Push title="Select Model" icon={Icon.List} target={<ModelList onSelect={onSelect} />} />
          <OpenPreferencesAction />
        </ActionPanel>
      }
    />
  );
}

/** A custom prompt that was deleted but is still referenced, e.g. by a Quicklink. */
function MissingPrompt() {
  return (
    <Detail
      markdown="This prompt no longer exists."
      actions={
        <ActionPanel>
          <Action
            title="Open Prompts"
            icon={Icon.List}
            onAction={() => launchCommand({ name: "prompts", type: LaunchType.UserInitiated })}
          />
        </ActionPanel>
      }
    />
  );
}

function OpenPreferencesAction() {
  return <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />;
}
