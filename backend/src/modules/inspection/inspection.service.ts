import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionItem } from '../../entities/inspection-item.entity';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(InspectionItem) private repo: Repository<InspectionItem>,
  ) {}

  findAll() {
    return this.repo.find({ order: { sortOrder: 'ASC', category: 'ASC' } });
  }

  findByCategory(category: string) {
    return this.repo.find({ where: { category }, order: { sortOrder: 'ASC' } });
  }
}
