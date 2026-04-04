import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './injection-tokens';

@Injectable()
export class RedisShutdownHook implements OnApplicationShutdown {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}
