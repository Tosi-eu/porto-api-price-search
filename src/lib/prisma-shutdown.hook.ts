import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PRISMA_CLIENT } from './injection-tokens';

@Injectable()
export class PrismaShutdownHook implements OnApplicationShutdown {
  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient | null,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}
