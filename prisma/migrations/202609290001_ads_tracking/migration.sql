-- Admin-controlled tracking IDs; intentionally no access tokens or arbitrary JS.
CREATE TABLE "AdsTrackingSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "googleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googleAdsId" TEXT NOT NULL DEFAULT '',
    "googlePurchaseLabel" TEXT NOT NULL DEFAULT '',
    "ga4MeasurementId" TEXT NOT NULL DEFAULT '',
    "metaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "metaPixelId" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdsTrackingSettings_pkey" PRIMARY KEY ("id")
);
