import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { DangerousGood } from './entities/dangerous-good.entity';
import { Vehicle } from './entities/vehicle.entity';
import { InspectionItem } from './entities/inspection-item.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(DangerousGood) private dgRepo: Repository<DangerousGood>,
    @InjectRepository(Vehicle) private vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(InspectionItem) private itemsRepo: Repository<InspectionItem>,
  ) {}

  async onModuleInit() {
    const userCount = await this.usersRepo.count();
    if (userCount === 0) {
      const hash = await bcrypt.hash('123456', 10);
      await this.usersRepo.save([
        { username: 'owner01', passwordHash: hash, name: '货主张三', role: 'owner', phone: '13800000001' },
        { username: 'freight01', passwordHash: hash, name: '货运员李四', role: 'freight', phone: '13800000002' },
        { username: 'super01', passwordHash: hash, name: '监管员王五', role: 'supervisor', phone: '13800000003' },
      ]);
      console.log('Users seeded');
    }

    const dgCount = await this.dgRepo.count();
    if (dgCount === 0) {
      await this.dgRepo.save([
        { unCode: 'UN1203', name: 'Gasoline', chineseName: '汽油', hazardClass: '3', requiredPackingGroup: 'II', isForbidden: false, isRestricted: false, remarks: '易燃液体' },
        { unCode: 'UN1090', name: 'Acetone', chineseName: '丙酮', hazardClass: '3', requiredPackingGroup: 'II', isForbidden: false, isRestricted: false, remarks: '' },
        { unCode: 'UN1403', name: 'Calcium carbide', chineseName: '碳化钙', hazardClass: '4.3', requiredPackingGroup: 'I', isForbidden: false, isRestricted: true, remarks: '遇水放出易燃气体，需审批' },
        { unCode: 'UN0001', name: 'Explosive sample', chineseName: '爆炸品样品', hazardClass: '1.1', requiredPackingGroup: 'I', isForbidden: true, isRestricted: false, remarks: '禁运品示例' },
      ]);
      console.log('Dangerous goods seeded');
    }

    const vCount = await this.vehiclesRepo.count();
    if (vCount === 0) {
      await this.vehiclesRepo.save([
        { plateNumber: '京A12345', vehicleType: '罐式货车', cleaned: true, inService: true, lastCleanedAt: new Date() },
        { plateNumber: '京B67890', vehicleType: '厢式货车', cleaned: false, inService: true },
        { plateNumber: '京C11111', vehicleType: '栏板货车', cleaned: true, inService: true, lastCleanedAt: new Date() },
      ]);
      console.log('Vehicles seeded');
    }

    const iCount = await this.itemsRepo.count();
    if (iCount === 0) {
      await this.itemsRepo.save([
        { category: '加固', name: '货物捆扎牢固', description: '检查所有捆扎带、绳索是否紧固', required: true, sortOrder: 1 },
        { category: '加固', name: '衬垫齐全', description: '货物与车体接触处应有衬垫', required: true, sortOrder: 2 },
        { category: '加固', name: '车门封条完好', description: '车门、厢门铅封或封条完好', required: true, sortOrder: 3 },
        { category: '消防', name: '灭火器配备', description: '随车灭火器在有效期内', required: true, sortOrder: 4 },
        { category: '标识', name: '危险标识粘贴', description: '按规定粘贴对应危险等级标识', required: true, sortOrder: 5 },
        { category: '标识', name: '随车文件齐全', description: '托运单、安全技术说明书等文件齐全', required: true, sortOrder: 6 },
      ]);
      console.log('Inspection items seeded');
    }
  }
}
