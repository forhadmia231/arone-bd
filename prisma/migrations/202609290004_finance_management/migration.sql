-- Additive migration. Does NOT change existing orders, products, checkout, shipment, stock, or invoices.
-- Old orders do not receive inferred costs: they remain explicitly uncosted until staff records a snapshot.
CREATE TABLE "ProductUnitCost" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductUnitCost_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductUnitCost_unitCost_check" CHECK ("unitCost" >= 0)
);
CREATE UNIQUE INDEX "ProductUnitCost_productId_key" ON "ProductUnitCost"("productId");
ALTER TABLE "ProductUnitCost" ADD CONSTRAINT "ProductUnitCost_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "FinanceOrderCost" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productCost" INTEGER NOT NULL,
    "packagingCost" INTEGER NOT NULL DEFAULT 0,
    "courierCost" INTEGER NOT NULL DEFAULT 0,
    "adsCost" INTEGER NOT NULL DEFAULT 0,
    "otherCost" INTEGER NOT NULL DEFAULT 0,
    "recordedById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FinanceOrderCost_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FinanceOrderCost_nonnegative_check" CHECK
      ("productCost" >= 0 AND "packagingCost" >= 0 AND "courierCost" >= 0 AND "adsCost" >= 0 AND "otherCost" >= 0 AND "version" >= 1)
);
CREATE UNIQUE INDEX "FinanceOrderCost_orderId_key" ON "FinanceOrderCost"("orderId");
ALTER TABLE "FinanceOrderCost" ADD CONSTRAINT "FinanceOrderCost_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "FinanceOrderCostRevision" (
    "id" TEXT NOT NULL,
    "orderCostId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinanceOrderCostRevision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FinanceOrderCostRevision_orderCostId_createdAt_idx" ON "FinanceOrderCostRevision"("orderCostId", "createdAt");
ALTER TABLE "FinanceOrderCostRevision" ADD CONSTRAINT "FinanceOrderCostRevision_orderCostId_fkey"
  FOREIGN KEY ("orderCostId") REFERENCES "FinanceOrderCost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "FinanceExpense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "incurredOn" TIMESTAMP(3) NOT NULL,
    "enteredById" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinanceExpense_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FinanceExpense_positive_check" CHECK ("amount" > 0)
);
CREATE INDEX "FinanceExpense_incurredOn_voidedAt_idx" ON "FinanceExpense"("incurredOn", "voidedAt");
CREATE INDEX "FinanceExpense_createdAt_idx" ON "FinanceExpense"("createdAt");
