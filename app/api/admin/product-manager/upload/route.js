import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { backofficeUser, sameOrigin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request) {
  try {
    if (!sameOrigin(request)) {
      return Response.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }

    const user = await backofficeUser();

    if (
      !user ||
      !(
        user.role === "ADMIN" ||
        user.canCreateProducts ||
        user.canEditProducts
      )
    ) {
      return Response.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return Response.json(
        { error: "Image file is required." },
        { status: 400 }
      );
    }

    const extension = allowed.get(file.type);

    if (!extension) {
      return Response.json(
        { error: "Only JPG, PNG and WebP images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > 3 * 1024 * 1024) {
      return Response.json(
        { error: "Each image must be 3MB or smaller." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const uploadsDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products"
    );

    await mkdir(uploadsDir, { recursive: true });

    const name =
      `${Date.now()}-${crypto.randomBytes(5).toString("hex")}.${extension}`;

    await writeFile(
      path.join(uploadsDir, name),
      bytes
    );

    return Response.json({
      ok: true,
      url: `/uploads/products/${name}`,
    });
  } catch (error) {
    console.error("Product image upload error:", error);

    return Response.json(
      {
        error:
          error?.message ||
          "Image upload failed.",
      },
      { status: 500 }
    );
  }
}
