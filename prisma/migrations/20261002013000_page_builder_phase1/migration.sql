CREATE TABLE IF NOT EXISTS "Page" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "pageType" TEXT NOT NULL DEFAULT 'PAGE',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "seoTitle" TEXT NOT NULL DEFAULT '',
  "seoDescription" TEXT NOT NULL DEFAULT '',
  "featuredImage" TEXT NOT NULL DEFAULT '',
  "showHeader" BOOLEAN NOT NULL DEFAULT true,
  "showFooter" BOOLEAN NOT NULL DEFAULT true,
  "fullWidth" BOOLEAN NOT NULL DEFAULT false,
  "content" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Page_slug_key" ON "Page"("slug");
CREATE INDEX IF NOT EXISTS "Page_status_updatedAt_idx" ON "Page"("status", "updatedAt");
CREATE INDEX IF NOT EXISTS "Page_pageType_status_idx" ON "Page"("pageType", "status");
