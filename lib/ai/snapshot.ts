export type TranscriptMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Render a chat transcript as plain text for storage in a `DesignSnapshot`.
 * Output is intentionally simple — Markdown-flavored text that's readable
 * in a `<pre>` block and survives a future copy-paste.
 */
export function formatTranscript(
  messages: TranscriptMessage[],
  problemTitle: string,
  savedAt: Date = new Date()
): string {
  const header = [
    `Interview · ${problemTitle}`,
    `Saved ${savedAt.toLocaleString()}`,
    "─────────────────────────────",
    "",
  ].join("\n");

  if (messages.length === 0) {
    return header + "(no messages yet)\n";
  }

  const body = messages
    .map((m) => {
      const speaker = m.role === "assistant" ? "Interviewer" : "You";
      return `[${speaker}]\n${m.content.trim()}\n`;
    })
    .join("\n");

  return header + body;
}
