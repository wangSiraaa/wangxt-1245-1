import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { ShipmentRecord } from './shipment-record.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plate_number', unique: true, length: 50 })
  plateNumber: string;

  @Column({ name: 'vehicle_type', length: 100, nullable: true })
  vehicleType: string;

  @Column({ default: false })
  cleaned: boolean;

  @Column({ name: 'last_cleaned_at', type: 'timestamp', nullable: true })
  lastCleanedAt: Date;

  @Column({ name: 'in_service', default: true })
  inService: boolean;

  @OneToMany(() => ShipmentRecord, (s) => s.vehicle)
  shipments: ShipmentRecord[];
}
