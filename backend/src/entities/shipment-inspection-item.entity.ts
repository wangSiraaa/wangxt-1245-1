import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ShipmentRecord } from './shipment-record.entity';
import { InspectionItem } from './inspection-item.entity';

@Entity('shipment_inspection_items')
@Unique(['shipmentId', 'inspectionItemId'])
export class ShipmentInspectionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ShipmentRecord, (s) => s.inspectionItemResults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipment_id' })
  shipment: ShipmentRecord;

  @Column({ name: 'shipment_id' })
  shipmentId: string;

  @ManyToOne(() => InspectionItem)
  @JoinColumn({ name: 'inspection_item_id' })
  inspectionItem: InspectionItem;

  @Column({ name: 'inspection_item_id' })
  inspectionItemId: string;

  @Column()
  passed: boolean;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'inspected_at' })
  inspectedAt: Date;
}
