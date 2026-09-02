/**
 * Renders text in a Detail exactly as it will be pasted: every ASCII punctuation
 * character is backslash-escaped (CommonMark allows escaping any of them), so
 * `*bold*` or `# heading` show up literally, and single line breaks are kept as
 * hard breaks instead of being folded into the paragraph.
 */
export function asPlainMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[!-/:-@[-`{-~]/g, "\\$&"))
    .join("  \n");
}

export function wordCount(text: string | undefined): number {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}
