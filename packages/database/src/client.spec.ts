import { describe, it, expect } from 'vitest';
import { prisma, PrismaClient } from './client';

describe('Database client', () => {
  it('exports PrismaClient constructor and singleton', () => {
    expect(PrismaClient).toBeDefined();
    expect(prisma).toBeDefined();
  });
});
