import { LeetCode, Credential } from "leetcode-query";
import { db } from "@/lib/db";

export async function getAuthedClient(): Promise<LeetCode | null> {
  const cred = await db.leetCodeCredential.findUnique({ where: { id: 1 } });
  if (!cred?.sessionCookie) return null;
  const credential = new Credential();
  await credential.init(cred.sessionCookie);
  return new LeetCode(credential);
}

export function getAnonClient(): LeetCode {
  return new LeetCode();
}
