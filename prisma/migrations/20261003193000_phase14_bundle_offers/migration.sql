DO $$ BEGIN
  CREATE TYPE "BundlePricingType" AS ENUM ('FIXED_PRICE', 'PERCENTAGE', 'FIXED_DISCOUNT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "bundleOfferId" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "bundleOfferTitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "bundleDiscountAmount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "BundleOffer" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "badge" TEXT NOT NULL DEFAULT 'COMBO OFFER',
  "imageUrl" TEXT NOT NULL DEFAULT '',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "pricingType" "BundlePricingType" NOT NULL DEFAULT 'FIXED_PRICE',
  "bundlePrice" INTEGER,
  "discountValue" INTEGER NOT NULL DEFAULT 0,
  "items" JSONB NOT NULL DEFAULT '[]',
  "insideDhakaFee" INTEGER NOT NULL DEFAULT 70,
  "outsideDhakaFee" INTEGER NOT NULL DEFAULT 130,
  "allowCoupon" BOOLEAN NOT NULL DEFAULT true,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "usageLimit" INTEGER,
  "perCustomerLimit" INTEGER NOT NULL DEFAULT 5,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BundleOffer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BundleOffer_slug_key" ON "BundleOffer"("slug");
CREATE INDEX IF NOT EXISTS "BundleOffer_active_startsAt_expiresAt_idx" ON "BundleOffer"("active", "startsAt", "expiresAt");
CREATE INDEX IF NOT EXISTS "BundleOffer_createdAt_idx" ON "BundleOffer"("createdAt");

CREATE TABLE IF NOT EXISTS "BundleUsage" (
  "id" TEXT NOT NULL,
  "bundleId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "phone" TEXT NOT NULL DEFAULT '',
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "regularAmount" INTEGER NOT NULL,
  "bundleAmount" INTEGER NOT NULL,
  "discountAmount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BundleUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BundleUsage_bundleId_createdAt_idx" ON "BundleUsage"("bundleId", "createdAt");
CREATE INDEX IF NOT EXISTS "BundleUsage_phone_bundleId_idx" ON "BundleUsage"("phone", "bundleId");
CREATE INDEX IF NOT EXISTS "BundleUsage_orderId_idx" ON "BundleUsage"("orderId");

DO $$ BEGIN
  ALTER TABLE "BundleUsage"
    ADD CONSTRAINT "BundleUsage_bundleId_fkey"
    FOREIGN KEY ("bundleId") REFERENCES "BundleOffer"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
