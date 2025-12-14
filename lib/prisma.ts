import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Disconnect and recreate on hot reload to avoid prepared statement issues
if (process.env.NODE_ENV !== "production") {
  if (globalThis.prismaGlobal) {
    globalThis.prismaGlobal.$disconnect();
  }
  globalThis.prismaGlobal = prisma;
}

export default prisma;
