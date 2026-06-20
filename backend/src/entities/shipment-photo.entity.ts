import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ShipmentRecord } from './shipment-record.entity';

@Entity('shipment_photos')
export class ShipmentPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ShipmentRecord, (s) => s.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipment_id' })
  shipment: ShipmentRecord;

  @Column({ name: 'shipment_id' })
  shipmentId: string;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'file_path', length: 500 })
  filePath: string;

  @Column({ name: 'file_size', type: 'int', nullable: true })
  fileSize: number;

  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
