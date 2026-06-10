"use server";

import { db } from "@/lib/db";
import { runSync } from "@/lib/leetcode/sync";
import { revalidatePath } from "next/cache";

export async function saveCredentials(formData: FormData) {
  const sessionCookie = String(formData.get("session") ?? "").trim();
  const csrfToken = String(formData.get("csrf") ?? "").trim();
  if (!sessionCookie) {
    return { ok: false, error: "Session cookie is required." };
  }
  await db.leetCodeCredential.upsert({
    where: { id: 1 },
    update: { sessionCookie, csrfToken },
    create: { id: 1, sessionCookie, csrfToken },
  });
  revalidatePath("/leetcode/settings");
  return { ok: true as const };
}

export async function clearCredentials() {
  await db.leetCodeCredential.deleteMany({});
  revalidatePath("/leetcode/settings");
  return { ok: true as const };
}

export async function triggerSync() {
  try {
    const result = await runSync();
    revalidatePath("/leetcode");
    revalidatePath("/leetcode/settings");
    revalidatePath("/leetcode/stats");
    revalidatePath("/");
    return { ok: true as const, result };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Unknown sync error",
    };
  }
}
