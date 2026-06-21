import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { DangerousGood, PackingGroup } from './dangerous-good.entity';
import { Vehicle } from './vehicle.entity';
import { ShipmentPhoto } from './shipment-photo.entity';
import { ShipmentInspectionItem } from './shipment-inspection-item.entity';

export type ShipmentStatus =
  | 'draft'
  | 'submitted'
  | 'inspecting'
  | 'photo_pending'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'shipped';

export type PhotoStatus = 'complete' | 'pending_resubmit';

@Entity('shipment_records')
export class ShipmentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shipment_no', unique: true, length: 50 })
  shipmentNo: string;

  @ManyToOne(() => User, (u) => u.ownedShipments)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => DangerousGood, (d) => d.shipments)
  @JoinColumn({ name: 'dangerous_good_id' })
  dangerousGood: DangerousGood;

  @Column({ name: 'dangerous_good_id' })
  dangerousGoodId: string;

  @Column({ name: 'packing_group', type: 'varchar', length: 5 })
  packingGroup: PackingGroup;

  @Column({ name: 'packing_method', length: 200, nullable: true })
  packingMethod: string;

  @ManyToOne(() => Vehicle, (v) => v.shipments)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @Column({ name: 'gross_weight', type: 'numeric', precision: 12, scale: 2, nullable: true })
  grossWeight: number;

  @Column({ type: 'int', nullable: true })
  quantity: number;

  @Column({ type: 'varchar', length: 30, default: 'draft' })
  status: ShipmentStatus;

  @Column({ name: 'packing_matched', type: 'boolean', nullable: true })
  packingMatched: boolean | null;

  @Column({ name: 'vehicle_clean_confirmed', type: 'boolean', nullable: true })
  vehicleCleanConfirmed: boolean | null;

  @Column({ name: 'photos_verified', type: 'boolean', nullable: true })
  photosVerified: boolean | null;

  @Column({ name: 'photo_status', type: 'varchar', length: 20, nullable: true })
  photoStatus: PhotoStatus | null;

  @Column({ name: 'photo_return_remark', type: 'text', nullable: true })
  photoReturnRemark: string | null;

  @Column({ name: 'photo_returned_at', type: 'timestamp', nullable: true })
  photoReturnedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'photo_returned_by_id' })
  photoReturnedBy: User | null;

  @Column({ name: 'photo_returned_by_id', nullable: true })
  photoReturnedById: string | null;

  @Column({ name: 'photo_resubmitted_at', type: 'timestamp', nullable: true })
  photoResubmittedAt: Date | null;

  @Column({ name: 'inspection_result', type: 'varchar', length: 10, nullable: true })
  inspectionResult: 'pass' | 'fail' | null;

  @Column({ name: 'inspection_remark', type: 'text', nullable: true })
  inspectionRemark: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'freight_inspector_id' })
  freightInspector: User | null;

  @Column({ name: 'freight_inspector_id', nullable: true })
  freightInspectorId: string | null;

  @Column({ name: 'supervisor_approved', type: 'boolean', nullable: true })
  supervisorApproved: boolean | null;

  @Column({ name: 'supervisor_remark', type: 'text', nullable: true })
  supervisorRemark: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: User | null;

  @Column({ name: 'supervisor_id', nullable: true })
  supervisorId: string | null;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'inspected_at', type: 'timestamp', nullable: true })
  inspectedAt: Date | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  shippedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ShipmentPhoto, (p) => p.shipment, { cascade: true })
  photos: ShipmentPhoto[];

  @OneToMany(() => ShipmentInspectionItem, (i) => i.shipment, { cascade: true })
  inspectionItemResults: ShipmentInspectionItem[];
}
