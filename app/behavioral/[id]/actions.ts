"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveAnswer(
  questionId: string,
  fields: { situation: string; task: string; action: string; result: string; projectTag: string }
) {
  const existing = await db.behavioralAnswer.findFirst({ where: { questionId } });
  if (existing) {
    await db.behavioralAnswer.update({
      where: { id: existing.id },
      data: fields,
    });
  } else {
    await db.behavioralAnswer.create({
      data: { questionId, ...fields },
    });
  }
  revalidatePath(`/behavioral/${questionId}`);
  revalidatePath(`/behavioral`);
  revalidatePath(`/`);
}
