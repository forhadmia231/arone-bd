CREATE TABLE IF NOT EXISTS "CustomerReview" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "title" TEXT NOT NULL DEFAULT '',
    "reviewText" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'Website',
    "productId" TEXT NOT NULL DEFAULT '',
    "productName" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CustomerReview_status_featured_createdAt_idx"
ON "CustomerReview"("status", "featured", "createdAt");

CREATE INDEX IF NOT EXISTS "CustomerReview_productId_idx"
ON "CustomerReview"("productId");
