import { prisma } from "@/lib/prisma";
import {
  adminUser,
  sameOrigin,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const defaults = {
  primaryColor: "#235B37",
  primaryDarkColor: "#173F29",
  primaryLightColor: "#EDF4E8",
  logoUrl: "",
};

function hex(value, fallback) {
  const text =
    typeof value === "string"
      ? value.trim()
      : "";

  return /^#[0-9a-fA-F]{6}$/.test(text)
    ? text.toUpperCase()
    : fallback;
}

function imageUrl(value) {
  const text =
    typeof value === "string"
      ? value.trim()
      : "";

  // Logo remove করলে empty string
  if (!text) {
    return "";
  }

  // PNG / JPG / WebP uploaded as Base64
  if (
    /^data:image\/(png|jpeg|webp);base64,/i.test(
      text
    )
  ) {
    // প্রায় 300 KB image-এর জন্য safe limit
    if (text.length > 450000) {
      throw new Error(
        "Logo is too large. Please use an image under 300 KB."
      );
    }

    return text;
  }

  // Local public path
  // Example: /uploads/arone-logo.webp
  if (text.startsWith("/")) {
    return text;
  }

  // Remote HTTPS image URL
  try {
    const url = new URL(text);

    if (url.protocol === "https:") {
      return text;
    }
  } catch {
    // নিচে proper error দেওয়া হবে
  }

  throw new Error(
    "Invalid logo. Please upload PNG/JPG/WebP or use a valid HTTPS image URL."
  );
}

/* =========================================
   GET THEME SETTINGS
========================================= */

export async function GET() {
  try {
    const user = await adminUser();

    if (!user) {
      return Response.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const settings =
      await prisma.siteSetting.findUnique({
        where: {
          id: 1,
        },

        select: {
          primaryColor: true,
          primaryDarkColor: true,
          primaryLightColor: true,
          logoUrl: true,
        },
      });

    return Response.json({
      settings: {
        ...defaults,
        ...(settings || {}),
      },
    });
  } catch (error) {
    console.error(
      "Theme settings GET error:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Could not load theme settings.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================
   SAVE THEME + LOGO
========================================= */

export async function PUT(request) {
  try {
    if (!sameOrigin(request)) {
      return Response.json(
        {
          error: "Invalid request origin",
        },
        {
          status: 403,
        }
      );
    }

    const user = await adminUser();

    if (!user) {
      return Response.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          error: "Invalid request data.",
        },
        {
          status: 400,
        }
      );
    }

    const data = {
      primaryColor: hex(
        body?.primaryColor,
        defaults.primaryColor
      ),

      primaryDarkColor: hex(
        body?.primaryDarkColor,
        defaults.primaryDarkColor
      ),

      primaryLightColor: hex(
        body?.primaryLightColor,
        defaults.primaryLightColor
      ),

      logoUrl: imageUrl(
        body?.logoUrl
      ),
    };

    const settings =
      await prisma.siteSetting.upsert({
        where: {
          id: 1,
        },

        update: data,

        create: {
          id: 1,
          ...data,
        },

        select: {
          primaryColor: true,
          primaryDarkColor: true,
          primaryLightColor: true,
          logoUrl: true,
        },
      });

    return Response.json({
      success: true,
      message:
        "Theme and logo saved successfully.",
      settings,
    });
  } catch (error) {
    console.error(
      "Theme settings PUT error:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Could not save theme settings.",
      },
      {
        status: 500,
      }
    );
  }
}