import { LaunchProps } from "@raycast/api";
import { Transform } from "./transform";

export default function Command(props: LaunchProps<{ arguments: Arguments.MakeShorter }>) {
  return <Transform promptId="make-shorter" text={props.arguments.text} />;
}
