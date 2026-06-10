import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

export type AICredentialRow = {
  apiKey: string;
  model: string;
  provider: string;
};

export class MissingAICredentialsError extends Error {
  constructor() {
    super("No AI credentials configured. Visit /settings.");
    this.name = "MissingAICredentialsError";
  }
}

export async function getCredentials(): Promise<AICredentialRow> {
  const cred = await db.aICredential.findUnique({ where: { id: 1 } });
  if (!cred?.apiKey) throw new MissingAICredentialsError();
  return { apiKey: cred.apiKey, model: cred.model, provider: cred.provider };
}

export function getClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}
