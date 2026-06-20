import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DangerousGood } from '../../entities/dangerous-good.entity';
import { DangerousGoodsController } from './dangerous-goods.controller';
import { DangerousGoodsService } from './dangerous-goods.service';

@Module({
  imports: [TypeOrmModule.forFeature([DangerousGood])],
  controllers: [DangerousGoodsController],
  providers: [DangerousGoodsService],
  exports: [DangerousGoodsService],
})
export class DangerousGoodsModule {}
