CREATE TABLE IF NOT EXISTS "CustomerNotificationTemplate" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
  "message" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerNotificationTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerNotificationTemplate_key_key"
ON "CustomerNotificationTemplate"("key");

CREATE TABLE IF NOT EXISTS "CustomerNotification" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "orderNo" TEXT NOT NULL DEFAULT '',
  "recipient" TEXT NOT NULL,
  "customerName" TEXT NOT NULL DEFAULT '',
  "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
  "templateKey" TEXT NOT NULL DEFAULT '',
  "eventKey" TEXT NOT NULL DEFAULT '',
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "error" TEXT NOT NULL DEFAULT '',
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CustomerNotification_status_createdAt_idx"
ON "CustomerNotification"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "CustomerNotification_orderNo_createdAt_idx"
ON "CustomerNotification"("orderNo", "createdAt");
CREATE INDEX IF NOT EXISTS "CustomerNotification_recipient_createdAt_idx"
ON "CustomerNotification"("recipient", "createdAt");
