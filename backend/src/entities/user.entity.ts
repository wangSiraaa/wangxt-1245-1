import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ShipmentRecord } from './shipment-record.entity';

export type UserRole = 'owner' | 'freight' | 'supervisor';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  role: UserRole;

  @Column({ length: 20, nullable: true })
  phone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ShipmentRecord, (s) => s.owner)
  ownedShipments: ShipmentRecord[];
}
