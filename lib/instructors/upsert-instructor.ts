import { prisma } from "@/lib/db/prisma";
import { instructorInputSchema } from "@/lib/zod/schemas";

export async function upsertInstructor(input: unknown, id?: string) {
  const data = instructorInputSchema.parse(input);

  const payload = {
    ...data,
    imageUrl: data.imageUrl || null,
    websiteUrl: data.websiteUrl || null,
    youtubeUrl: data.youtubeUrl || null,
    instagramUrl: data.instagramUrl || null,
    xUrl: data.xUrl || null,
    facebookUrl: data.facebookUrl || null,
    discordUrl: data.discordUrl || null,
    telegramUrl: data.telegramUrl || null,
  };

  if (id) {
    return prisma.instructor.update({
      where: { id },
      data: payload,
    });
  }

  return prisma.instructor.create({
    data: payload,
  });
}
