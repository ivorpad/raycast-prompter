import { LaunchProps } from "@raycast/api";
import { Transform } from "./transform";

export default function Command(props: LaunchProps<{ arguments: Arguments.MakeLonger }>) {
  return <Transform promptId="make-longer" text={props.arguments.text} />;
}
