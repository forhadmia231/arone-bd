import { prisma } from "@/lib/prisma";
import { adminUser, sameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function clean(value, max = 500) {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function slugify(text) {
  return clean(text, 150)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    if (!(await adminUser())) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { products: true } },
      },
    });

    return Response.json({ categories });
  } catch (error) {
    console.error("Category GET error:", error);
    return Response.json(
      { error: error?.message || "Could not load categories." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!sameOrigin(request)) {
      return Response.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }

    if (!(await adminUser())) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = clean(body?.name, 120);

    if (!name) {
      return Response.json(
        { error: "Category name is required." },
        { status: 400 }
      );
    }

    const slug = slugify(body?.slug || name);

    if (!slug) {
      return Response.json(
        { error: "A valid slug is required." },
        { status: 400 }
      );
    }

    const exists = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
      select: { id: true },
    });

    if (exists) {
      return Response.json(
        { error: "A category with the same name or slug already exists." },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: clean(body?.description, 1000),
        imageUrl:
          clean(body?.imageUrl, 2000) ||
          "/categories/default.svg",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { products: true } },
      },
    });

    return Response.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error("Category POST error:", error);
    return Response.json(
      { error: error?.message || "Could not create category." },
      { status: 500 }
    );
  }
}
