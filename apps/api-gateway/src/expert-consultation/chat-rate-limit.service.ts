import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';
import { CHAT_RATE_LIMIT_PER_SECOND } from './chat.constants';

@Injectable()
export class ChatRateLimitService {
  constructor(private readonly redis: RedisService) {}

  async assertWithinLimit(userId: string): Promise<void> {
    const key = `expert-chat:rate:${userId}`;
    const client = this.redis.getClient();
    const count = await client.incr(key);

    if (count === 1) {
      await client.expire(key, 1);
    }

    if (count > CHAT_RATE_LIMIT_PER_SECOND) {
      throw new Error('Rate limit exceeded. Please slow down.');
    }
  }
}
