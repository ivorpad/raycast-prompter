import { Action, ActionPanel, Detail, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { FormValidation, useForm } from "@raycast/utils";
import { useState } from "react";
import { DEFAULT_RULES, Prompt } from "./builtin-prompts";
import { PromptInput } from "./prompt-store";
import { promptQuicklink } from "./quicklink";

interface PromptValues {
  title: string;
  instruction: string;
}

interface PromptFormProps {
  /** The prompt being edited; omit to create a new one. */
  prompt?: Prompt;
  /** Pre-filled values for a new prompt (used by Duplicate). */
  initial?: Partial<PromptValues>;
  onSave: (input: PromptInput) => Promise<Prompt>;
}

export function PromptForm({ prompt, initial, onSave }: PromptFormProps) {
  const { pop } = useNavigation();
  // A new prompt turns the form into the "added" screen, so Esc from there returns to the list.
  const [added, setAdded] = useState<Prompt>();
  const { handleSubmit, itemProps } = useForm<PromptValues>({
    initialValues: {
      title: prompt?.title ?? initial?.title ?? "",
      instruction: prompt?.instruction ?? initial?.instruction ?? "",
    },
    validation: { title: FormValidation.Required, instruction: FormValidation.Required },
    onSubmit: async (values) => {
      const saved = await onSave({
        id: prompt?.id,
        title: values.title.trim(),
        instruction: values.instruction.trim(),
      });
      if (prompt) {
        await showToast({ style: Toast.Style.Success, title: "Prompt saved" });
        pop();
      } else {
        setAdded(saved);
      }
    },
  });

  if (added) return <PromptAdded prompt={added} />;

  return (
    <Form
      navigationTitle={prompt ? `Edit ${prompt.title}` : "New Prompt"}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Prompt" icon={Icon.Check} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      {prompt?.builtIn ? (
        <Form.Description title="Title" text={`${prompt.title} (built-in: the command keeps its name)`} />
      ) : (
        <Form.TextField title="Title" placeholder="Translate to English" {...itemProps.title} />
      )}
      <Form.TextArea
        title="Instruction"
        placeholder="What should the model do with the text?"
        info="Sent after the shared rules as the task."
        {...itemProps.instruction}
      />
    </Form>
  );
}

/** Shown once a new prompt is saved: the one step that puts it in root search next to the built-in commands. */
function PromptAdded({ prompt }: { prompt: Prompt }) {
  const { pop } = useNavigation();
  const markdown = [
    `**${prompt.title}** is saved and runs from the Prompts list.`,
    "",
    "To run it from Raycast's root search like the built-in commands, add it as a Quicklink.",
    "It gets its own entry under this name, and can have an alias and a hotkey.",
    "Raycast can't add commands while an extension runs, so this is the way.",
  ].join("\n");

  return (
    <Detail
      navigationTitle="Prompt Added"
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CreateQuicklink title="Add to Root Search" icon={Icon.Link} quicklink={promptQuicklink(prompt)} />
          <Action title="Back to Prompts" icon={Icon.ArrowLeft} onAction={pop} />
        </ActionPanel>
      }
    />
  );
}

interface RulesFormProps {
  rules: string;
  onSave: (rules: string) => Promise<void>;
}

/** The preamble every prompt shares. */
export function RulesForm({ rules, onSave }: RulesFormProps) {
  const { pop } = useNavigation();
  const { handleSubmit, itemProps, setValue } = useForm<{ rules: string }>({
    initialValues: { rules },
    validation: { rules: FormValidation.Required },
    onSubmit: async (values) => {
      await onSave(values.rules);
      await showToast({ style: Toast.Style.Success, title: "Rules saved" });
      pop();
    },
  });

  return (
    <Form
      navigationTitle="Shared Rules"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Rules" icon={Icon.Check} onSubmit={handleSubmit} />
          <Action
            title="Reset to Default"
            icon={Icon.ArrowCounterClockwise}
            onAction={() => setValue("rules", DEFAULT_RULES)}
          />
        </ActionPanel>
      }
    >
      <Form.Description text="Sent before every prompt's task. Keep it short; the task line does the specific work." />
      <Form.TextArea title="Rules" {...itemProps.rules} />
    </Form>
  );
}
