CREATE TABLE IF NOT EXISTS "PageMedia" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageMedia_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PageMedia_updatedAt_idx" ON "PageMedia"("updatedAt");

CREATE TABLE IF NOT EXISTS "ReusableSection" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "block" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReusableSection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ReusableSection_updatedAt_idx" ON "ReusableSection"("updatedAt");

CREATE TABLE IF NOT EXISTS "PageLead" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL DEFAULT '',
  "pageTitle" TEXT NOT NULL DEFAULT '',
  "pageSlug" TEXT NOT NULL DEFAULT '',
  "formName" TEXT NOT NULL DEFAULT 'Lead Form',
  "name" TEXT NOT NULL DEFAULT '',
  "phone" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT '',
  "message" TEXT NOT NULL DEFAULT '',
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageLead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PageLead_status_createdAt_idx" ON "PageLead"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "PageLead_pageId_createdAt_idx" ON "PageLead"("pageId", "createdAt");
