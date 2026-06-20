import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { DangerousGoodsModule } from './modules/dangerous-goods/dangerous-goods.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { InspectionModule } from './modules/inspection/inspection.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { UploadModule } from './modules/upload/upload.module';
import { User } from './entities/user.entity';
import { DangerousGood } from './entities/dangerous-good.entity';
import { Vehicle } from './entities/vehicle.entity';
import { InspectionItem } from './entities/inspection-item.entity';
import { ShipmentRecord } from './entities/shipment-record.entity';
import { ShipmentPhoto } from './entities/shipment-photo.entity';
import { ShipmentInspectionItem } from './entities/shipment-inspection-item.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'database.sqlite',
      entities: [
        User,
        DangerousGood,
        Vehicle,
        InspectionItem,
        ShipmentRecord,
        ShipmentPhoto,
        ShipmentInspectionItem,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      User,
      DangerousGood,
      Vehicle,
      InspectionItem,
    ]),
    AuthModule,
    DangerousGoodsModule,
    VehiclesModule,
    InspectionModule,
    ShipmentsModule,
    UploadModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
