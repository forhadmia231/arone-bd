CREATE TABLE IF NOT EXISTS "PageMarketingSettings" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "analyticsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "metaEvent" TEXT NOT NULL DEFAULT 'Lead',
  "ga4Event" TEXT NOT NULL DEFAULT 'generate_lead',
  "stickyEnabled" BOOLEAN NOT NULL DEFAULT false,
  "stickyType" TEXT NOT NULL DEFAULT 'LINK',
  "stickyLabel" TEXT NOT NULL DEFAULT 'Order Now',
  "stickyUrl" TEXT NOT NULL DEFAULT '/shop',
  "stickyPhone" TEXT NOT NULL DEFAULT '',
  "stickyMessage" TEXT NOT NULL DEFAULT '',
  "publishAt" TIMESTAMP(3),
  "unpublishAt" TIMESTAMP(3),
  "thankYouUrl" TEXT NOT NULL DEFAULT '',
  "ogTitle" TEXT NOT NULL DEFAULT '',
  "ogDescription" TEXT NOT NULL DEFAULT '',
  "ogImage" TEXT NOT NULL DEFAULT '',
  "canonicalUrl" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageMarketingSettings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PageMarketingSettings_pageId_key" ON "PageMarketingSettings"("pageId");
CREATE INDEX IF NOT EXISTS "PageMarketingSettings_publishAt_idx" ON "PageMarketingSettings"("publishAt");
CREATE INDEX IF NOT EXISTS "PageMarketingSettings_unpublishAt_idx" ON "PageMarketingSettings"("unpublishAt");

CREATE TABLE IF NOT EXISTS "PageEvent" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "pageSlug" TEXT NOT NULL DEFAULT '',
  "eventType" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT '',
  "href" TEXT NOT NULL DEFAULT '',
  "source" TEXT NOT NULL DEFAULT 'direct',
  "medium" TEXT NOT NULL DEFAULT '',
  "campaign" TEXT NOT NULL DEFAULT '',
  "content" TEXT NOT NULL DEFAULT '',
  "term" TEXT NOT NULL DEFAULT '',
  "referrer" TEXT NOT NULL DEFAULT '',
  "path" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PageEvent_pageId_eventType_createdAt_idx" ON "PageEvent"("pageId", "eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "PageEvent_source_createdAt_idx" ON "PageEvent"("source", "createdAt");
CREATE INDEX IF NOT EXISTS "PageEvent_campaign_createdAt_idx" ON "PageEvent"("campaign", "createdAt");

ALTER TABLE "PageLead" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE "PageLead" ADD COLUMN IF NOT EXISTS "medium" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PageLead" ADD COLUMN IF NOT EXISTS "campaign" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PageLead" ADD COLUMN IF NOT EXISTS "referrer" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PageLead" ADD COLUMN IF NOT EXISTS "landingPath" TEXT NOT NULL DEFAULT '';
