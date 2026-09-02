import { getPreferenceValues } from "@raycast/api";
import { useLocalStorage } from "@raycast/utils";

/**
 * The chosen model id, stored per provider so switching providers does not
 * leave you pointing at a model the other API does not know.
 */
export function useModel() {
  const { provider } = getPreferenceValues<Preferences>();
  const { value, setValue, isLoading } = useLocalStorage<string>(`model:${provider}`);
  return { model: value, setModel: setValue, isLoading };
}
