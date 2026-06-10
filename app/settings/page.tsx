import { db } from "@/lib/db";
import { SettingsForm } from "@/app/leetcode/settings/SettingsForm";
import { AISettingsForm } from "./AISettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [leetcodeCred, aiCred] = await Promise.all([
    db.leetCodeCredential.findUnique({ where: { id: 1 } }),
    db.aICredential.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 mb-2">
          Sweatshirt
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-zinc-500 mt-1">
          Local credentials for syncing your LeetCode account and powering the AI interviewer.
          Both are stored in SQLite on this machine only.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">AI / Interviewer</h2>
        <AISettingsForm credential={aiCred} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">LeetCode sync</h2>
        <SettingsForm credential={leetcodeCred} />
      </section>
    </div>
  );
}
