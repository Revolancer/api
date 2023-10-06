import { Module, forwardRef } from '@nestjs/common';
import { IndexService } from './index.service';
import { ContentIndex } from './entities/contentindex.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { NeedPost } from '../need/entities/need-post.entity';
import { PortfolioPost } from '../portfolio/entities/portfolio-post.entity';
import { RedlockModule } from '@anchan828/nest-redlock';
import { RedisConfigModule } from 'src/config/redis/config.module';
import { RedisConfigService } from 'src/config/redis/config.service';
import { Redis } from 'ioredis';
import { BullModule } from '@nestjs/bull';
import { IndexController } from './index.controller';
import { IndexConsumer } from './queue/index.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentIndex, User, NeedPost, PortfolioPost]),
    forwardRef(() => UsersModule),
    RedlockModule.registerAsync({
      imports: [RedisConfigModule],
      inject: [RedisConfigService],
      useFactory: async (redisConfig: RedisConfigService) => ({
        clients: [
          new Redis({
            host: redisConfig.host,
            port: redisConfig.port,
          }),
        ],
        settings: {
          driftFactor: 0.01,
          retryCount: 10,
          retryDelay: 200,
          retryJitter: 200,
          automaticExtensionThreshold: 500,
        },
        duration: 1000,
      }),
    }),
    BullModule.registerQueue({ name: 'index' }),
  ],
  providers: [IndexService, IndexConsumer],
  exports: [IndexService],
  controllers: [IndexController],
})
export class IndexModule {}
