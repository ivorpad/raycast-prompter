/**
 * Prepares text for a Detail. Raycast's renderer is not full CommonMark: backslash
 * escapes are shown literally and `\(`…`\)` switches to LaTeX, so escaping
 * punctuation to show text "as is" makes it unreadable. The text is rendered as the
 * markdown it usually is; single line breaks become hard breaks so the line
 * structure matches what gets pasted.
 */
export function asMarkdown(text: string): string {
  return text.replace(/\r\n?/g, "\n").split("\n").join("  \n");
}

export function wordCount(text: string | undefined): number {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}
