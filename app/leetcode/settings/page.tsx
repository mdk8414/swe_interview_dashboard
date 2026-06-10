import { db } from "@/lib/db";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function LeetCodeSettings() {
  const credential = await db.leetCodeCredential.findUnique({ where: { id: 1 } });
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-2">
          LeetCode
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-zinc-500 mt-1">
          Local credentials used to sync your solved problems. Stored in SQLite on this machine only.
        </p>
      </div>
      <SettingsForm credential={credential} />
    </div>
  );
}
