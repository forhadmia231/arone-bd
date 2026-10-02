-- Add a restricted staff role without changing existing ADMIN/CUSTOMER accounts.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "staffRole" TEXT NOT NULL DEFAULT 'Viewer',
  ADD COLUMN IF NOT EXISTS "staffActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "canViewProducts" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canCreateProducts" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canEditProducts" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canDeleteProducts" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "SiteSetting" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "primaryColor" TEXT NOT NULL DEFAULT '#235b37',
  "primaryDarkColor" TEXT NOT NULL DEFAULT '#173f29',
  "primaryLightColor" TEXT NOT NULL DEFAULT '#edf4e8',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteSetting" (
  "id",
  "primaryColor",
  "primaryDarkColor",
  "primaryLightColor",
  "updatedAt"
)
VALUES (
  1,
  '#235b37',
  '#173f29',
  '#edf4e8',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
