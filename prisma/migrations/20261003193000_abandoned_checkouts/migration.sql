CREATE TABLE IF NOT EXISTS "AbandonedCheckout" (
  "id" TEXT NOT NULL,
  "sessionKey" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT '',
  "phone" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT '',
  "address" TEXT NOT NULL DEFAULT '',
  "city" TEXT NOT NULL DEFAULT '',
  "area" TEXT NOT NULL DEFAULT '',
  "note" TEXT NOT NULL DEFAULT '',
  "source" TEXT NOT NULL DEFAULT '',
  "utmSource" TEXT NOT NULL DEFAULT '',
  "utmMedium" TEXT NOT NULL DEFAULT '',
  "utmCampaign" TEXT NOT NULL DEFAULT '',
  "pageUrl" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "payload" JSONB,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "contactedAt" TIMESTAMP(3),
  "recoveredAt" TIMESTAMP(3),
  "dismissedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AbandonedCheckout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AbandonedCheckout_sessionKey_key"
ON "AbandonedCheckout"("sessionKey");

CREATE INDEX IF NOT EXISTS "AbandonedCheckout_status_lastSeenAt_idx"
ON "AbandonedCheckout"("status", "lastSeenAt");

CREATE INDEX IF NOT EXISTS "AbandonedCheckout_phone_lastSeenAt_idx"
ON "AbandonedCheckout"("phone", "lastSeenAt");
