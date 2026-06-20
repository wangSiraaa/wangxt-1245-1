import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionItem } from '../../entities/inspection-item.entity';
import { InspectionController } from './inspection.controller';
import { InspectionService } from './inspection.service';

@Module({
  imports: [TypeOrmModule.forFeature([InspectionItem])],
  controllers: [InspectionController],
  providers: [InspectionService],
  exports: [InspectionService],
})
export class InspectionModule {}
