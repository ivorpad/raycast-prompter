import { LaunchProps } from "@raycast/api";
import { Transform } from "./transform";

export default function Command(props: LaunchProps<{ arguments: Arguments.ForSlack }>) {
  return <Transform promptId="for-slack" text={props.arguments.text} />;
}
