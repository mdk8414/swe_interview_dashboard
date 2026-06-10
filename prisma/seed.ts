import { PrismaClient } from "../lib/generated/prisma/client";
import { systemDesignSeed } from "../lib/seed/system-design";
import { behavioralSeed } from "../lib/seed/behavioral";

const db = new PrismaClient();

async function main() {
  for (const p of systemDesignSeed) {
    await db.systemDesignProblem.upsert({
      where: { slug: p.slug },
      update: { title: p.title, prompt: p.prompt },
      create: { slug: p.slug, title: p.title, prompt: p.prompt },
    });
  }
  console.log(`Seeded ${systemDesignSeed.length} system design problems`);

  let questionCount = 0;
  for (const [name, questions] of Object.entries(behavioralSeed)) {
    const category = await db.behavioralCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    for (const q of questions) {
      const existing = await db.behavioralQuestion.findFirst({
        where: { categoryId: category.id, text: q.text },
      });
      if (!existing) {
        await db.behavioralQuestion.create({
          data: {
            categoryId: category.id,
            text: q.text,
            isCommon: q.isCommon ?? true,
          },
        });
      }
      questionCount++;
    }
  }
  console.log(`Seeded ${questionCount} behavioral questions across ${Object.keys(behavioralSeed).length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
