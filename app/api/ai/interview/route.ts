import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { getCredentials, MissingAICredentialsError } from "@/lib/ai/anthropic";
import {
  buildSystemPrompt,
  toAnthropicMessages,
  KICKOFF_USER_MESSAGE,
  type HistoryMessage,
} from "@/lib/ai/interview";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReqBody = {
  problemId: string;
  message?: string;
  diagramPngBase64?: string;
  diagramLabel?: string;
  kickoff?: boolean;
};

export async function POST(req: NextRequest) {
  let body: ReqBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const { problemId, message, diagramPngBase64, diagramLabel, kickoff } = body;
  if (!problemId) {
    return NextResponse.json({ ok: false, error: "Missing problemId." }, { status: 400 });
  }

  // Load credentials
  let cred;
  try {
    cred = await getCredentials();
  } catch (err) {
    if (err instanceof MissingAICredentialsError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: 412 }
      );
    }
    throw err;
  }

  const problem = await db.systemDesignProblem.findUnique({
    where: { id: problemId },
  });
  if (!problem) {
    return NextResponse.json({ ok: false, error: "Problem not found." }, { status: 404 });
  }

  // Get or create the (single) conversation for this problem.
  let conversation = await db.designConversation.findUnique({
    where: { problemId: problem.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) {
    conversation = await db.designConversation.create({
      data: { problemId: problem.id, model: cred.model },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  // For kickoff we synthesize the user turn but don't persist it.
  const userMessage = kickoff ? KICKOFF_USER_MESSAGE : (message ?? "").trim();
  if (!userMessage && !kickoff) {
    return NextResponse.json(
      { ok: false, error: "Empty message." },
      { status: 400 }
    );
  }

  const history: HistoryMessage[] = conversation.messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
    diagramLabel: m.diagramLabel ?? null,
  }));

  const client = new Anthropic({ apiKey: cred.apiKey });
  const systemPrompt = buildSystemPrompt({
    title: problem.title,
    prompt: problem.prompt,
    notes: problem.notes,
  });
  const messages = toAnthropicMessages(
    history,
    userMessage,
    diagramPngBase64 ?? null
  );

  const encoder = new TextEncoder();
  const conversationId = conversation.id;
  const persistedUserMessage = kickoff ? null : userMessage;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const messageStream = client.messages.stream({
          model: cred.model,
          max_tokens: 8192,
          thinking: { type: "adaptive" },
          output_config: { effort: "medium" },
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
        });

        messageStream.on("text", (delta) => {
          send({ type: "delta", text: delta });
        });

        const final = await messageStream.finalMessage();
        const assistantText = final.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");

        // Persist on success only.
        if (persistedUserMessage !== null) {
          await db.designMessage.create({
            data: {
              conversationId,
              role: "user",
              content: persistedUserMessage,
              diagramLabel: diagramLabel ?? null,
            },
          });
        }
        if (assistantText.length > 0) {
          await db.designMessage.create({
            data: {
              conversationId,
              role: "assistant",
              content: assistantText,
            },
          });
        }
        await db.designConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        send({
          type: "done",
          stopReason: final.stop_reason,
          usage: final.usage,
        });
        controller.close();
      } catch (err) {
        let msg = "Unknown error.";
        if (err instanceof Anthropic.AuthenticationError) {
          msg = "Authentication failed — check your API key in Settings.";
        } else if (err instanceof Anthropic.APIError) {
          msg = `API error ${err.status}: ${err.message}`;
        } else if (err instanceof Error) {
          msg = err.message;
        }
        send({ type: "error", error: msg });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
