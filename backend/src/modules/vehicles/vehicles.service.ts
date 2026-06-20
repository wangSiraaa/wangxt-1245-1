import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private repo: Repository<Vehicle>) {}

  findAll(status?: 'cleaned' | 'available') {
    if (status === 'cleaned') {
      return this.repo.find({ where: { cleaned: true, inService: true } });
    }
    if (status === 'available') {
      return this.repo.find({ where: { inService: true } });
    }
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOneBy({ id });
  }

  async confirmClean(id: string) {
    const vehicle = await this.repo.findOneBy({ id });
    if (!vehicle) throw new NotFoundException('车辆不存在');
    vehicle.cleaned = true;
    vehicle.lastCleanedAt = new Date();
    await this.repo.save(vehicle);
    return { success: true, cleaned: true, confirmedAt: vehicle.lastCleanedAt };
  }
}
