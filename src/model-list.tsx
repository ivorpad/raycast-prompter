import { Action, ActionPanel, getPreferenceValues, Icon, List, openExtensionPreferences, Keyboard } from "@raycast/api";
import { showFailureToast, useCachedPromise } from "@raycast/utils";
import { getProvider, needsPreferences } from "./llm";
import { useModel } from "./model";

interface Props {
  /** Called with the model id the user picked. Persisting it is the caller's job. */
  onSelect: (modelId: string) => void | Promise<void>;
}

/** Models the current provider exposes, fetched live from its /models endpoint. */
export function ModelList({ onSelect }: Props) {
  const provider = getProvider();
  const { model } = useModel();

  // Cached per provider: the list shows instantly on the next run and refreshes in the background.
  const { data, isLoading, error, revalidate } = useCachedPromise(
    async (providerId: Preferences["provider"]) => ({ providerId, models: await getProvider().listModels() }),
    [getPreferenceValues<Preferences>().provider],
    {
      onError: async (e) => {
        await showFailureToast(e, {
          title: "Could not load models",
          primaryAction: needsPreferences(e)
            ? { title: "Open Extension Preferences", onAction: () => openExtensionPreferences() }
            : undefined,
        });
      },
    },
  );

  const refresh = (
    <Action
      title="Refresh List"
      icon={Icon.ArrowClockwise}
      shortcut={Keyboard.Shortcut.Common.Refresh}
      onAction={revalidate}
    />
  );

  return (
    <List isLoading={isLoading} searchBarPlaceholder={`Search ${provider.label} models…`}>
      {error ? (
        <List.EmptyView
          icon={Icon.Warning}
          title="Could not load models"
          description={error.message}
          actions={
            <ActionPanel>
              {refresh}
              <Action title="Open Extension Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      ) : (
        data?.models.map((m) => (
          <List.Item
            key={m.id}
            title={m.name}
            subtitle={m.name !== m.id ? m.id : undefined}
            keywords={[m.id]}
            accessories={m.id === model ? [{ icon: Icon.Checkmark, tooltip: "Current model" }] : undefined}
            actions={
              <ActionPanel>
                <Action title="Use This Model" icon={Icon.Check} onAction={() => onSelect(m.id)} />
                <Action.CopyToClipboard title="Copy Model ID" content={m.id} />
                {refresh}
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
