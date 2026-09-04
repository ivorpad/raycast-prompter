import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard, List } from "@raycast/api";
import { Prompt } from "./builtin-prompts";
import { asMarkdown } from "./markdown";
import { PromptForm, RulesForm } from "./prompt-form";
import { usePrompts } from "./prompt-store";
import { promptDeeplink, promptQuicklink } from "./quicklink";
import { Transform } from "./transform";

export function PromptsList() {
  const store = usePrompts();
  const builtIn = store.prompts.filter((p) => p.builtIn);
  const custom = store.prompts.filter((p) => !p.builtIn);

  const newPrompt = (
    <Action.Push
      title="New Prompt"
      icon={Icon.Plus}
      shortcut={Keyboard.Shortcut.Common.New}
      target={<PromptForm onSave={store.save} />}
    />
  );
  const editRules = (
    <Action.Push
      title="Edit Shared Rules"
      icon={Icon.Text}
      shortcut={{ modifiers: ["cmd", "shift"], key: "r" }}
      target={<RulesForm rules={store.rules} onSave={store.setRules} />}
    />
  );

  const item = (p: Prompt) => (
    <List.Item
      key={p.id}
      title={p.title}
      icon={p.builtIn ? Icon.Star : Icon.Pencil}
      accessories={p.edited ? [{ tag: "Edited" }] : undefined}
      detail={
        <List.Item.Detail
          markdown={asMarkdown(p.instruction)}
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title="Type" text={p.builtIn ? "Built-in" : "Custom"} />
              {p.edited && <List.Item.Detail.Metadata.Label title="Instruction" text="Edited" />}
            </List.Item.Detail.Metadata>
          }
        />
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Push title="Run" icon={Icon.Play} target={<Transform promptId={p.id} />} />
            {!p.builtIn && (
              <Action.CreateQuicklink
                title="Add to Root Search"
                icon={Icon.Link}
                shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
                quicklink={promptQuicklink(p)}
              />
            )}
            <Action.Push
              title="Edit"
              icon={Icon.Pencil}
              shortcut={Keyboard.Shortcut.Common.Edit}
              target={<PromptForm prompt={p} onSave={store.save} />}
            />
            <Action.Push
              title="Duplicate"
              icon={Icon.Duplicate}
              shortcut={Keyboard.Shortcut.Common.Duplicate}
              target={
                <PromptForm initial={{ title: `${p.title} Copy`, instruction: p.instruction }} onSave={store.save} />
              }
            />
            {p.edited && (
              <Action title="Reset to Default" icon={Icon.ArrowCounterClockwise} onAction={() => store.reset(p.id)} />
            )}
            {!p.builtIn && (
              <Action
                title="Delete"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                shortcut={Keyboard.Shortcut.Common.Remove}
                onAction={async () => {
                  const ok = await confirmAlert({
                    title: `Delete "${p.title}"?`,
                    message: "A Quicklink made for it stays in root search until you delete it there.",
                    primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
                  });
                  if (ok) await store.remove(p.id);
                }}
              />
            )}
          </ActionPanel.Section>
          <ActionPanel.Section>
            {p.builtIn && (
              <Action.CreateQuicklink
                title="Create Quicklink (Run with an Argument)"
                icon={Icon.Link}
                quicklink={promptQuicklink(p)}
              />
            )}
            <Action.CopyToClipboard
              title="Copy Deeplink"
              shortcut={Keyboard.Shortcut.Common.CopyDeeplink}
              content={promptDeeplink(p)}
            />
            {newPrompt}
            {editRules}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );

  return (
    <List
      isLoading={store.isLoading}
      isShowingDetail
      searchBarPlaceholder="Search prompts…"
      actions={
        <ActionPanel>
          {newPrompt}
          {editRules}
        </ActionPanel>
      }
    >
      <List.Section title="Built-in">{builtIn.map(item)}</List.Section>
      <List.Section title="Custom">
        {custom.map(item)}
        {!store.isLoading && (
          <List.Item
            title="New Prompt…"
            icon={Icon.Plus}
            detail={
              <List.Item.Detail markdown="Add your own prompt. It runs from this list, and one more step puts it in Raycast's root search next to the built-in commands." />
            }
            actions={
              <ActionPanel>
                {newPrompt}
                {editRules}
              </ActionPanel>
            }
          />
        )}
      </List.Section>
    </List>
  );
}
