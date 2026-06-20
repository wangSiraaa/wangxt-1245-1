import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { ShipmentRecord } from './shipment-record.entity';

export type PackingGroup = 'I' | 'II' | 'III';

@Entity('dangerous_goods')
export class DangerousGood {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'un_code', length: 20, nullable: true })
  unCode: string;

  @Column({ length: 200 })
  name: string;

  @Column({ name: 'chinese_name', length: 200, nullable: true })
  chineseName: string;

  @Column({ name: 'hazard_class', length: 20, nullable: true })
  hazardClass: string;

  @Column({
    name: 'required_packing_group',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  requiredPackingGroup: PackingGroup;

  @Column({ name: 'is_forbidden', default: false })
  isForbidden: boolean;

  @Column({ name: 'is_restricted', default: false })
  isRestricted: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => ShipmentRecord, (s) => s.dangerousGood)
  shipments: ShipmentRecord[];
}
