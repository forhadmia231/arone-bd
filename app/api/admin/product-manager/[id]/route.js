import { prisma } from "@/lib/prisma";
import { backofficeUser, sameOrigin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function allowed(user, permission) {
  return Boolean(
    user &&
    (
      user.role === "ADMIN" ||
      user[permission] === true
    )
  );
}

function clean(value, max = 3000) {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function intValue(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableInt(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugify(text) {
  return clean(text, 160)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanImages(value) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const out = [];

  for (const item of value) {
    const url = clean(item, 2000);
    if (!url || seen.has(url)) continue;

    if (
      !url.startsWith("/") &&
      !url.startsWith("https://")
    ) {
      continue;
    }

    seen.add(url);
    out.push(url);

    if (out.length >= 12) break;
  }

  return out;
}

export async function PUT(request, context) {
  try {
    if (!sameOrigin(request)) {
      return Response.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }

    const user = await backofficeUser();

    if (!allowed(user, "canEditProducts")) {
      return Response.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const existing =
      await prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          stock: true,
        },
      });

    if (!existing) {
      return Response.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const name = clean(body?.name, 220);

    if (!name) {
      return Response.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    const slug = slugify(
      body?.slug || name
    );

    const categoryId = clean(
      body?.categoryId,
      100
    );

    const price = intValue(body?.price, -1);
    const stock = intValue(body?.stock, -1);
    const compareAtPrice =
      nullableInt(body?.compareAtPrice);

    if (
      !slug ||
      !categoryId ||
      price < 0 ||
      stock < 0
    ) {
      return Response.json(
        {
          error:
            "Please check slug, category, price and stock.",
        },
        { status: 400 }
      );
    }

    const duplicate =
      await prisma.product.findFirst({
        where: {
          id: { not: id },
          slug,
        },
        select: { id: true },
      });

    if (duplicate) {
      return Response.json(
        {
          error:
            "Another product already uses this slug.",
        },
        { status: 409 }
      );
    }

    const imageUrls =
      cleanImages(body?.imageUrls);

    const mainImage =
      clean(body?.imageUrl, 2000) ||
      imageUrls[0] ||
      "/products/default.svg";

    const product =
      await prisma.$transaction(
        async (db) => {
          const updated =
            await db.product.update({
              where: { id },
              data: {
                name,
                slug,
                description: clean(
                  body?.description,
                  10000
                ),
                imageUrl: mainImage,
                price,
                compareAtPrice,
                stock,
                active:
                  body?.active !== false,
                featured:
                  body?.featured === true,
                categoryId,
              },
            });

          await db.productImage.deleteMany({
            where: { productId: id },
          });

          if (imageUrls.length) {
            await db.productImage.createMany({
              data: imageUrls.map(
                (imageUrl, index) => ({
                  productId: id,
                  imageUrl,
                  sortOrder: index,
                })
              ),
            });
          }

          if (existing.stock !== stock) {
            await db.stockAdjustment.create({
              data: {
                productId: id,
                adminId: user.id,
                beforeStock:
                  existing.stock,
                afterStock: stock,
                delta:
                  stock -
                  existing.stock,
                reason:
                  "Product edited from admin",
              },
            });
          }

          return db.product.findUnique({
            where: { id },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              images: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          });
        }
      );

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Product manager PUT error:", error);

    return Response.json(
      {
        error:
          error?.message ||
          "Could not update product.",
      },
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

    const user = await backofficeUser();

    if (!allowed(user, "canDeleteProducts")) {
      return Response.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(
      () => ({})
    );

    const product =
      await prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

    if (!product) {
      return Response.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    if (
      clean(body?.confirmName, 220) !==
      product.name
    ) {
      return Response.json(
        {
          error:
            "Product name confirmation did not match.",
        },
        { status: 400 }
      );
    }

    if (product._count.orderItems > 0) {
      return Response.json(
        {
          error:
            `এই product ${product._count.orderItems}টি order item-এ ব্যবহার হয়েছে। Order history রক্ষার জন্য Permanent Delete করা যাবে না। Archive ব্যবহার করুন।`,
        },
        { status: 409 }
      );
    }

    try {
      await prisma.$transaction(
        async (db) => {
          await db.productImage.deleteMany({
            where: { productId: id },
          });

          await db.stockAdjustment.deleteMany({
            where: { productId: id },
          });

          await db.productUnitCost.deleteMany({
            where: { productId: id },
          });

          await db.product.delete({
            where: { id },
          });
        }
      );
    } catch (error) {
      if (error?.code === "P2003") {
        return Response.json(
          {
            error:
              "এই product অন্য feature (যেমন Bundle/Promotion)-এ ব্যবহার হচ্ছে। আগে সেই relation remove করুন, তারপর delete করুন।",
          },
          { status: 409 }
        );
      }

      throw error;
    }

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error("Product manager DELETE error:", error);

    return Response.json(
      {
        error:
          error?.message ||
          "Could not permanently delete product.",
      },
      { status: 500 }
    );
  }
}
