import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditLogEntry } from './entities/credit-log-entry.entity';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { UserBalance } from './entities/user-balance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserBalance, CreditLogEntry])],
  providers: [CreditsService],
  exports: [CreditsService],
  controllers: [CreditsController],
})
export class CreditsModule {}
