import { prisma } from "@/lib/db/prisma";
import {
  normalizePublicThemeFamily,
  PUBLIC_THEME_FAMILY_SETTING_KEY,
  type PublicThemeFamily,
} from "@/lib/theme/public-theme";

type PublicThemeFamilySetting = {
  family?: unknown;
};

function readFamilySetting(value: unknown): PublicThemeFamily {
  if (!value || typeof value !== "object") {
    return "perseus";
  }

  return normalizePublicThemeFamily((value as PublicThemeFamilySetting).family);
}

export async function getActivePublicThemeFamily(): Promise<PublicThemeFamily> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: PUBLIC_THEME_FAMILY_SETTING_KEY },
      select: { value: true },
    });

    return readFamilySetting(setting?.value);
  } catch (error) {
    console.error("Failed to load public theme family", error);
    return "perseus";
  }
}
