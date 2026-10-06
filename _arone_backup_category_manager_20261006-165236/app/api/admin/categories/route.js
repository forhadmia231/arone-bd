import { prisma } from "@/lib/prisma";
import {
  adminUser,
  sameOrigin,
} from "@/lib/auth";

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
    .replace(/-+/g, "-");
}

/* =========================
   UPDATE CATEGORY
========================= */

export async function PUT(request, context) {
  try {
    if (!sameOrigin(request)) {
      return Response.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }

    if (!(await adminUser())) {
      return Response.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const body =
      await request.json();

    const name =
      clean(body?.name, 120);

    if (!name) {
      return Response.json(
        {
          error:
            "Category name is required.",
        },
        { status: 400 }
      );
    }

    const slug =
      slugify(body?.slug || name);

    const category =
      await prisma.category.update({
        where: { id },

        data: {
          name,
          slug,

          description:
            clean(
              body?.description,
              1000
            ),

          imageUrl:
            clean(
              body?.imageUrl,
              2000
            ) ||
            "/categories/default.svg",
        },
      });

    return Response.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error(
      "Category update error:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Could not update category.",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE CATEGORY
========================= */

export async function DELETE(
  request,
  context
) {
  try {
    if (!sameOrigin(request)) {
      return Response.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }

    if (!(await adminUser())) {
      return Response.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } =
      await context.params;

    const category =
      await prisma.category.findUnique({
        where: { id },

        select: {
          id: true,
          name: true,

          _count: {
            select: {
              products: true,
            },
          },
        },
      });

    if (!category) {
      return Response.json(
        {
          error:
            "Category not found.",
        },
        { status: 404 }
      );
    }

    /*
      IMPORTANT:
      Product থাকলে category delete হবে না।
      এতে accidental product loss হবে না।
    */

    if (
      category._count.products > 0
    ) {
      return Response.json(
        {
          error:
            `এই category-তে ${category._count.products}টি product আছে। আগে productগুলো অন্য category-তে move করুন।`,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Category delete error:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Could not delete category.",
      },
      { status: 500 }
    );
  }
}