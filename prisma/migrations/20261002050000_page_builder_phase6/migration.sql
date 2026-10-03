CREATE TABLE IF NOT EXISTS "PageRevision" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "pageType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "seoTitle" TEXT NOT NULL DEFAULT '',
  "seoDescription" TEXT NOT NULL DEFAULT '',
  "featuredImage" TEXT NOT NULL DEFAULT '',
  "showHeader" BOOLEAN NOT NULL DEFAULT true,
  "showFooter" BOOLEAN NOT NULL DEFAULT true,
  "fullWidth" BOOLEAN NOT NULL DEFAULT false,
  "content" JSONB NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "note" TEXT NOT NULL DEFAULT '',
  "createdById" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PageRevision_pageId_createdAt_idx"
ON "PageRevision"("pageId", "createdAt");
