import { Action, ActionPanel, Detail, Icon, LaunchProps } from "@raycast/api";
import { findPrompt, usePrompts } from "./prompt-store";
import { PromptsList } from "./prompts-list";
import { Transform } from "./transform";

/** `prompts` alone browses; `prompts <name>` runs that prompt on the selection. Quicklinks use the latter. */
export default function Command(props: LaunchProps<{ arguments: Arguments.Prompts }>) {
  const query = props.arguments.prompt?.trim();
  return query ? <RunByName query={query} /> : <PromptsList />;
}

function RunByName({ query }: { query: string }) {
  const { prompts, isLoading } = usePrompts();
  if (isLoading) return <Detail isLoading markdown="" />;

  const prompt = findPrompt(prompts, query);
  if (prompt) return <Transform promptId={prompt.id} />;

  return (
    <Detail
      markdown={`No prompt matches "${query}".\n\nAvailable: ${prompts.map((p) => p.title).join(", ")}.`}
      actions={
        <ActionPanel>
          <Action.Push title="Browse Prompts" icon={Icon.List} target={<PromptsList />} />
        </ActionPanel>
      }
    />
  );
}
