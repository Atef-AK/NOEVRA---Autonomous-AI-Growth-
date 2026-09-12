import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple Prisma instances in development (hot reload)
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });
}

/**
 * Singleton Prisma client.
 * In development, attach to global to survive hot-module reloading.
 * In production, create once per process.
 */
export const prisma: PrismaClient =
  process.env['NODE_ENV'] === 'production'
    ? createPrismaClient()
    : (global.__prisma ?? (global.__prisma = createPrismaClient()));

export { PrismaClient };
export * from '@prisma/client';
