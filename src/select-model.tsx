import { showHUD } from "@raycast/api";
import { ModelList } from "./model-list";
import { useModel } from "./model";

export default function Command() {
  const { setModel } = useModel();
  return (
    <ModelList
      onSelect={async (id) => {
        await setModel(id);
        await showHUD(`Model: ${id}`);
      }}
    />
  );
}
