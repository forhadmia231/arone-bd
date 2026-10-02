
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { adminUser } from "@/lib/auth";
import { DEFAULT_APPEARANCE } from "@/lib/appearance-defaults";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const globalForAppearance = globalThis;

const prisma =
  globalForAppearance.__aroneAppearancePrisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForAppearance.__aroneAppearancePrisma = prisma;
}

const imageKeys = [
  "logoUrl",
  "desktopBannerUrl",
  "mobileBannerUrl",
];

const linkKeys = ["primaryHref", "secondaryHref"];

function validImageUrl(value) {
  if (!value) return true;

  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\s\\]/.test(value)
  ) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function validInternalLink(value) {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\s\\]/.test(value)
  );
}

async function readSettings() {
  const saved = await prisma.storeAppearance.findUnique({
    where: { id: 1 },
  });

  return {
    ...DEFAULT_APPEARANCE,
    ...(saved || {}),
  };
}

export async function GET() {
  try {
    const settings = await readSettings();

    return NextResponse.json(
      { settings },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Appearance GET error:", error);

    return NextResponse.json(
      { error: "Store appearance could not be loaded." },
      { status: 503 }
    );
  }
}

export async function PUT(request) {
  try {
    const admin = await adminUser();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const origin = request.headers.get("origin");

    if (
      origin &&
      new URL(origin).origin !== new URL(request.url).origin
    ) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = {};

    for (const key of Object.keys(DEFAULT_APPEARANCE)) {
      if (typeof body[key] !== "string") {
        return NextResponse.json(
          { error: `Invalid ${key}.` },
          { status: 400 }
        );
      }

      const value = body[key].trim();

      if (value.length > (imageKeys.includes(key) ? 700 : 350)) {
        return NextResponse.json(
          { error: `${key} is too long.` },
          { status: 400 }
        );
      }

      if (imageKeys.includes(key) && !validImageUrl(value)) {
        return NextResponse.json(
          { error: `${key}: use HTTPS or a local /public image path.` },
          { status: 400 }
        );
      }

      if (linkKeys.includes(key) && !validInternalLink(value)) {
        return NextResponse.json(
          { error: `${key}: use a local website path.` },
          { status: 400 }
        );
      }

      data[key] = value;
    }

    const settings = await prisma.storeAppearance.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Appearance PUT error:", error);

    return NextResponse.json(
      { error: "Unable to save appearance settings." },
      { status: 500 }
    );
  }
}
