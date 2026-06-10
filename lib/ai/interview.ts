import type Anthropic from "@anthropic-ai/sdk";

export type ProblemContext = {
  title: string;
  prompt: string;
  notes: string | null;
};

export type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
  diagramLabel: string | null;
};

// Synthetic kickoff user turn — never persisted, only sent so the assistant
// has a turn to respond to when the conversation is empty.
export const KICKOFF_USER_MESSAGE =
  "Hi. I'd like you to interview me on this system design problem. Could you introduce yourself, restate the problem in your own words, and ask me how I'd like to start?";

export function buildSystemPrompt(problem: ProblemContext): string {
  const notesSection = problem.notes?.trim()
    ? problem.notes.trim()
    : "(none yet)";
  return `You are a senior staff engineer running a system design interview. Your candidate is working on the following problem:

**${problem.title}**

${problem.prompt}

Their working notes (for your context only — don't quote them back verbatim):
${notesSection}

You will receive an image of their current architecture diagram with each turn (or a note that no diagram exists yet if they haven't started drawing). Behave like a real interviewer:

- Lead with open-ended questions before drilling into specifics.
- Push them on capacity estimates, failure modes, consistency tradeoffs, and operational concerns.
- Don't volunteer the answer — get them to reason through it. If they propose something off-track, ask probing questions instead of correcting them outright.
- When they have a diagram, reference what you see concretely ("I see a single load balancer in front of three app servers — what happens if that LB goes down?").
- Keep responses concise (one focused question or one short observation at a time). Use markdown for formatting when it helps readability.
- Stay in character. You're the interviewer; let them drive the solution.`;
}

/**
 * Build the Messages API request body. The system prompt is cacheable across
 * turns in the same conversation, so we attach cache_control to it.
 */
export function toAnthropicMessages(
  history: HistoryMessage[],
  currentUserMessage: string,
  pngBase64: string | null
): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = [];

  for (const msg of history) {
    messages.push({
      role: msg.role,
      content: [{ type: "text", text: msg.content }],
    });
  }

  // The newest user turn carries the image (if any) plus the text.
  const userContent: Anthropic.ContentBlockParam[] = [];
  if (pngBase64) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: pngBase64,
      },
    });
  } else {
    userContent.push({
      type: "text",
      text: "(No diagram drawn yet.)",
    });
  }
  userContent.push({ type: "text", text: currentUserMessage });

  messages.push({ role: "user", content: userContent });
  return messages;
}
