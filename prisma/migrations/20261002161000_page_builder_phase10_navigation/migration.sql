CREATE TABLE IF NOT EXISTS "NavigationItem" (
  "id" TEXT NOT NULL,
  "location" TEXT NOT NULL DEFAULT 'HEADER',
  "labelEn" TEXT NOT NULL DEFAULT '',
  "labelBn" TEXT NOT NULL DEFAULT '',
  "href" TEXT NOT NULL DEFAULT '/',
  "pageId" TEXT NOT NULL DEFAULT '',
  "linkType" TEXT NOT NULL DEFAULT 'CUSTOM',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NavigationItem_location_active_sortOrder_idx"
ON "NavigationItem"("location", "active", "sortOrder");
