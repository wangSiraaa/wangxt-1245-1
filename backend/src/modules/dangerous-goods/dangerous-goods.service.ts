import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { DangerousGood } from '../../entities/dangerous-good.entity';

@Injectable()
export class DangerousGoodsService {
  constructor(
    @InjectRepository(DangerousGood) private repo: Repository<DangerousGood>,
  ) {}

  findAll(keyword?: string) {
    if (keyword) {
      return this.repo.find({
        where: [
          { chineseName: Like(`%${keyword}%`) },
          { name: Like(`%${keyword}%`) },
          { unCode: Like(`%${keyword}%`) },
        ],
      });
    }
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOneBy({ id });
  }
}
