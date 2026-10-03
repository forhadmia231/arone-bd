CREATE TABLE IF NOT EXISTS "PromotionCampaign" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'BANNER',
  "title" TEXT NOT NULL DEFAULT '',
  "message" TEXT NOT NULL DEFAULT '',
  "imageUrl" TEXT NOT NULL DEFAULT '',
  "buttonText" TEXT NOT NULL DEFAULT '',
  "buttonUrl" TEXT NOT NULL DEFAULT '',
  "couponCode" TEXT NOT NULL DEFAULT '',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "dismissible" BOOLEAN NOT NULL DEFAULT true,
  "showOncePerSession" BOOLEAN NOT NULL DEFAULT false,
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "backgroundColor" TEXT NOT NULL DEFAULT '#173F29',
  "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
  "targetPath" TEXT NOT NULL DEFAULT '*',
  "position" TEXT NOT NULL DEFAULT 'BOTTOM',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromotionCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PromotionCampaign_active_priority_idx"
ON "PromotionCampaign"("active", "priority");

CREATE INDEX IF NOT EXISTS "PromotionCampaign_startAt_endAt_idx"
ON "PromotionCampaign"("startAt", "endAt");
