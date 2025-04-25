import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async set(key: string, value: string, ttl = 300) {
    await this.redis.set(key, value, 'EX', ttl);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async delete(key: string) {
    await this.redis.del(key);
  }
}
