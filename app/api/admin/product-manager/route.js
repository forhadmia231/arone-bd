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

export async function GET() {
  try {
    const user = await backofficeUser();

    if (!allowed(user, "canViewProducts")) {
      return Response.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const [products, categories] =
      await prisma.$transaction([
        prisma.product.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            images: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                imageUrl: true,
                sortOrder: true,
              },
            },
          },
        }),

        prisma.category.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        }),
      ]);

    return Response.json({
      products,
      categories,
      permissions: {
        view: allowed(user, "canViewProducts"),
        create: allowed(user, "canCreateProducts"),
        edit: allowed(user, "canEditProducts"),
        delete: allowed(user, "canDeleteProducts"),
      },
    });
  } catch (error) {
    console.error("Product manager GET error:", error);

    return Response.json(
      {
        error:
          error?.message ||
          "Could not load products.",
      },
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

    const user = await backofficeUser();

    if (!allowed(user, "canCreateProducts")) {
      return Response.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = clean(body?.name, 220);

    if (!name) {
      return Response.json(
        { error: "Product name is required." },
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

    const categoryId = clean(
      body?.categoryId,
      100
    );

    if (!categoryId) {
      return Response.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }

    const price = intValue(body?.price, -1);
    const stock = intValue(body?.stock, -1);
    const compareAtPrice =
      nullableInt(body?.compareAtPrice);

    if (price < 0 || stock < 0) {
      return Response.json(
        {
          error:
            "Price and stock must be valid non-negative numbers.",
        },
        { status: 400 }
      );
    }

    const duplicate =
      await prisma.product.findFirst({
        where: { slug },
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

const product = await prisma.product.create({
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

    active: body?.active !== false,
    featured: body?.featured === true,

    categoryId,

    images: imageUrls.length
      ? {
          create: imageUrls.map(
            (imageUrl, index) => ({
              imageUrl,
              sortOrder: index,
            })
          ),
        }
      : undefined,

    stockAdjustments:
      stock !== 0
        ? {
            create: {
              adminId: user.id,
              beforeStock: 0,
              afterStock: stock,
              delta: stock,
              reason: "Initial product stock",
            },
          }
        : undefined,
  },

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

    return Response.json(
      { success: true, product },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product manager POST error:", error);

    return Response.json(
      {
        error:
          error?.message ||
          "Could not create product.",
      },
      { status: 500 }
    );
  }
}

