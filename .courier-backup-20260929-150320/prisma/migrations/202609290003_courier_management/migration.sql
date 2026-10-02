-- Additive migration: does not alter or reset existing Orders, Stock or Payments.
CREATE TYPE "CourierShipmentStatus" AS ENUM (
    'DRAFT', 'BOOKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
    'DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED'
);

CREATE TABLE "CourierShipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "courierName" TEXT NOT NULL,
    "consignmentId" TEXT NOT NULL DEFAULT '',
    "trackingUrl" TEXT NOT NULL DEFAULT '',
    "status" "CourierShipmentStatus" NOT NULL DEFAULT 'DRAFT',
    "codExpected" INTEGER NOT NULL,
    "codCollected" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourierShipment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CourierShipment_cod_check" CHECK ("codExpected" >= 0 AND "codCollected" >= 0 AND "codCollected" <= "codExpected")
);
CREATE UNIQUE INDEX "CourierShipment_orderId_key" ON "CourierShipment"("orderId");
CREATE INDEX "CourierShipment_status_updatedAt_idx" ON "CourierShipment"("status", "updatedAt");
ALTER TABLE "CourierShipment" ADD CONSTRAINT "CourierShipment_orderId_fkey"
 FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CourierShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "fromStatus" "CourierShipmentStatus",
    "toStatus" "CourierShipmentStatus" NOT NULL,
    "beforeCollected" INTEGER NOT NULL,
    "afterCollected" INTEGER NOT NULL,
    "fromCourierName" TEXT NOT NULL DEFAULT '',
    "toCourierName" TEXT NOT NULL DEFAULT '',
    "fromConsignment" TEXT NOT NULL DEFAULT '',
    "toConsignment" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourierShipmentEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CourierShipmentEvent_shipmentId_createdAt_idx" ON "CourierShipmentEvent"("shipmentId", "createdAt");
CREATE INDEX "CourierShipmentEvent_createdAt_idx" ON "CourierShipmentEvent"("createdAt");
ALTER TABLE "CourierShipmentEvent" ADD CONSTRAINT "CourierShipmentEvent_shipmentId_fkey"
 FOREIGN KEY ("shipmentId") REFERENCES "CourierShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourierShipmentEvent" ADD CONSTRAINT "CourierShipmentEvent_adminId_fkey"
 FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
