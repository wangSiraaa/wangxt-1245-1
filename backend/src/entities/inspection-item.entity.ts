import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('inspection_items')
export class InspectionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  category: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  required: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
