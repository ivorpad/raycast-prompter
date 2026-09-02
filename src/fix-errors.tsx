import { LaunchProps } from "@raycast/api";
import { Transform } from "./transform";

export default function Command(props: LaunchProps<{ arguments: Arguments.FixErrors }>) {
  return <Transform promptId="fix-errors" text={props.arguments.text} />;
}
