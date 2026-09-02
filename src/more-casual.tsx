import { LaunchProps } from "@raycast/api";
import { Transform } from "./transform";

export default function Command(props: LaunchProps<{ arguments: Arguments.MoreCasual }>) {
  return <Transform promptId="more-casual" text={props.arguments.text} />;
}
