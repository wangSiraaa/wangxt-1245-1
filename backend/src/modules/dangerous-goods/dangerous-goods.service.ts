import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
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
          { chineseName: ILike(`%${keyword}%`) },
          { name: ILike(`%${keyword}%`) },
          { unCode: ILike(`%${keyword}%`) },
        ],
      });
    }
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOneBy({ id });
  }
}
