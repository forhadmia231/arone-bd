import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__aronePrisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__aronePrisma = prisma;
}
