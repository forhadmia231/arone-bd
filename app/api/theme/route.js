import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";

const defaults = {
  primaryColor: "#235b37",
  primaryDarkColor: "#173f29",
  primaryLightColor: "#edf4e8",
  logoUrl: "",
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findUnique({
      where: { id: 1 },
      select: {
        primaryColor: true,
        primaryDarkColor: true,
        primaryLightColor: true,
        logoUrl: true,
      },
    });

    return json({
      theme: settings || defaults,
    });
  } catch {
    return json({
      theme: defaults,
    });
  }
}