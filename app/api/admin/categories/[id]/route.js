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

export async function PUT(request, context) {
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

    const { id } = await context.params;
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

    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: id },
        OR: [{ name }, { slug }],
      },
      select: { id: true },
    });

    if (duplicate) {
      return Response.json(
        { error: "Another category already uses this name or slug." },
        { status: 409 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
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

    return Response.json({ success: true, category });
  } catch (error) {
    console.error("Category PUT error:", error);
    return Response.json(
      { error: error?.message || "Could not update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
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

    const { id } = await context.params;

    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return Response.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    if (category._count.products > 0) {
      return Response.json(
        {
          error: `এই category-তে ${category._count.products}টি product আছে। আগে productগুলো অন্য category-তে move করুন।`,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Category DELETE error:", error);
    return Response.json(
      { error: error?.message || "Could not delete category." },
      { status: 500 }
    );
  }
}
