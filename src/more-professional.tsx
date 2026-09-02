import { LaunchProps } from "@raycast/api";
import { Transform } from "./transform";

export default function Command(props: LaunchProps<{ arguments: Arguments.MoreProfessional }>) {
  return <Transform promptId="more-professional" text={props.arguments.text} />;
}
