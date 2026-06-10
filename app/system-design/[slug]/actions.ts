"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveNotes(slug: string, notes: string) {
  await db.systemDesignProblem.update({
    where: { slug },
    data: { notes },
  });
  revalidatePath(`/system-design/${slug}`);
}

export async function saveDiagram(diagramId: string, sceneJson: string) {
  await db.diagram.update({
    where: { id: diagramId },
    data: { sceneJson },
  });
}

export async function createDiagram(problemId: string, label: string) {
  const d = await db.diagram.create({
    data: {
      problemId,
      label,
      sceneJson: JSON.stringify({ elements: [], appState: {}, files: {} }),
    },
  });
  return d.id;
}

export async function renameDiagram(diagramId: string, label: string) {
  await db.diagram.update({ where: { id: diagramId }, data: { label } });
}

export async function deleteDiagram(diagramId: string) {
  await db.diagram.delete({ where: { id: diagramId } });
}

export async function resetConversation(problemId: string, slug: string) {
  await db.designConversation.deleteMany({ where: { problemId } });
  revalidatePath(`/system-design/${slug}`);
  return { ok: true as const };
}

// ── Snapshots ──────────────────────────────────────────────────────────────

export async function saveSnapshot(
  problemId: string,
  slug: string,
  input: {
    transcript: string;
    diagramPngBase64: string | null;
    diagramLabel: string | null;
    messageCount: number;
  }
) {
  const snap = await db.designSnapshot.create({
    data: {
      problemId,
      transcript: input.transcript,
      diagramPng: input.diagramPngBase64,
      diagramLabel: input.diagramLabel,
      messageCount: input.messageCount,
    },
  });
  revalidatePath(`/system-design/${slug}`);
  return { ok: true as const, id: snap.id };
}

export async function renameSnapshot(
  snapshotId: string,
  slug: string,
  name: string
) {
  const trimmed = name.trim();
  await db.designSnapshot.update({
    where: { id: snapshotId },
    data: { name: trimmed.length > 0 ? trimmed : null },
  });
  revalidatePath(`/system-design/${slug}`);
  return { ok: true as const };
}

export async function deleteSnapshot(snapshotId: string, slug: string) {
  await db.designSnapshot.delete({ where: { id: snapshotId } });
  revalidatePath(`/system-design/${slug}`);
  return { ok: true as const };
}
