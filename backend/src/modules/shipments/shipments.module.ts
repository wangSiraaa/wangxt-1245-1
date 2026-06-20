import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentRecord } from '../../entities/shipment-record.entity';
import { ShipmentPhoto } from '../../entities/shipment-photo.entity';
import { ShipmentInspectionItem } from '../../entities/shipment-inspection-item.entity';
import { DangerousGood } from '../../entities/dangerous-good.entity';
import { Vehicle } from '../../entities/vehicle.entity';
import { InspectionItem } from '../../entities/inspection-item.entity';
import { User } from '../../entities/user.entity';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShipmentRecord,
      ShipmentPhoto,
      ShipmentInspectionItem,
      DangerousGood,
      Vehicle,
      InspectionItem,
      User,
    ]),
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
