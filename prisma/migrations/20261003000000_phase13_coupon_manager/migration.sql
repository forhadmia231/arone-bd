DO $$ BEGIN
  CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CouponScope" AS ENUM ('ALL_PRODUCTS', 'SELECTED_PRODUCTS', 'SELECTED_CATEGORIES');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "couponCode" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "discountAmount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "discountType" "CouponDiscountType" NOT NULL DEFAULT 'PERCENTAGE',
  "discountValue" INTEGER NOT NULL,
  "minOrderAmount" INTEGER NOT NULL DEFAULT 0,
  "maxDiscountAmount" INTEGER,
  "scope" "CouponScope" NOT NULL DEFAULT 'ALL_PRODUCTS',
  "productIds" JSONB NOT NULL DEFAULT '[]',
  "categoryIds" JSONB NOT NULL DEFAULT '[]',
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "usageLimit" INTEGER,
  "perCustomerLimit" INTEGER NOT NULL DEFAULT 1,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "landingPageOnly" BOOLEAN NOT NULL DEFAULT false,
  "pageIds" JSONB NOT NULL DEFAULT '[]',
  "autoApply" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_active_startsAt_expiresAt_idx" ON "Coupon"("active", "startsAt", "expiresAt");
CREATE INDEX IF NOT EXISTS "Coupon_autoApply_active_idx" ON "Coupon"("autoApply", "active");
CREATE INDEX IF NOT EXISTS "Coupon_createdAt_idx" ON "Coupon"("createdAt");

CREATE TABLE IF NOT EXISTS "CouponUsage" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "phone" TEXT NOT NULL DEFAULT '',
  "discountAmount" INTEGER NOT NULL,
  "orderAmount" INTEGER NOT NULL,
  "source" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CouponUsage_couponId_createdAt_idx" ON "CouponUsage"("couponId", "createdAt");
CREATE INDEX IF NOT EXISTS "CouponUsage_phone_couponId_idx" ON "CouponUsage"("phone", "couponId");
CREATE INDEX IF NOT EXISTS "CouponUsage_orderId_idx" ON "CouponUsage"("orderId");
