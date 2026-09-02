import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { FormValidation, useForm } from "@raycast/utils";
import { DEFAULT_RULES, Prompt } from "./builtin-prompts";
import { PromptInput } from "./prompt-store";

interface PromptValues {
  title: string;
  instruction: string;
}

interface PromptFormProps {
  /** The prompt being edited; omit to create a new one. */
  prompt?: Prompt;
  /** Pre-filled values for a new prompt (used by Duplicate). */
  initial?: Partial<PromptValues>;
  onSave: (input: PromptInput) => Promise<void>;
}

export function PromptForm({ prompt, initial, onSave }: PromptFormProps) {
  const { pop } = useNavigation();
  const { handleSubmit, itemProps } = useForm<PromptValues>({
    initialValues: {
      title: prompt?.title ?? initial?.title ?? "",
      instruction: prompt?.instruction ?? initial?.instruction ?? "",
    },
    validation: { title: FormValidation.Required, instruction: FormValidation.Required },
    onSubmit: async (values) => {
      await onSave({ id: prompt?.id, title: values.title.trim(), instruction: values.instruction.trim() });
      await showToast({ style: Toast.Style.Success, title: prompt ? "Prompt saved" : "Prompt added" });
      pop();
    },
  });

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
