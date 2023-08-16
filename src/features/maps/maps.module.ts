import { Module } from '@nestjs/common';
import { MapsConfigModule } from 'src/config/maps/config.module';
import { MapsService } from './maps.service';

@Module({
  imports: [MapsConfigModule],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
