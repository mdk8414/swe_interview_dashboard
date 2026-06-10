"use server";

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveAICredentials(formData: FormData) {
  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const model = String(formData.get("model") ?? "claude-sonnet-4-6").trim();
  if (!apiKey) {
    return { ok: false as const, error: "API key is required." };
  }
  await db.aICredential.upsert({
    where: { id: 1 },
    update: { apiKey, model, provider: "anthropic" },
    create: { id: 1, apiKey, model, provider: "anthropic" },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function clearAICredentials() {
  await db.aICredential.deleteMany({});
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function testAIConnection() {
  const cred = await db.aICredential.findUnique({ where: { id: 1 } });
  if (!cred?.apiKey) {
    return { ok: false as const, error: "No API key saved." };
  }
  try {
    const client = new Anthropic({ apiKey: cred.apiKey });
    // Cheap probe: ask the model to reply with a single word.
    const response = await client.messages.create({
      model: cred.model,
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with the single word: OK" }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return {
      ok: true as const,
      model: response.model,
      reply: text,
    };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return { ok: false as const, error: "Authentication failed — check your API key." };
    }
    if (err instanceof Anthropic.APIError) {
      return { ok: false as const, error: `API error ${err.status}: ${err.message}` };
    }
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Unknown error.",
    };
  }
}
