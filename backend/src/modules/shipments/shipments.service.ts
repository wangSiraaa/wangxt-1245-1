import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentRecord, ShipmentStatus, PhotoStatus } from '../../entities/shipment-record.entity';
import { ShipmentPhoto } from '../../entities/shipment-photo.entity';
import { ShipmentInspectionItem } from '../../entities/shipment-inspection-item.entity';
import { DangerousGood, PackingGroup } from '../../entities/dangerous-good.entity';
import { Vehicle } from '../../entities/vehicle.entity';
import { InspectionItem } from '../../entities/inspection-item.entity';
import { v4 as uuid } from 'uuid';

export interface CreateShipmentDto {
  dangerousGoodId: string;
  packingGroup: PackingGroup;
  packingMethod: string;
  vehicleId: string;
  grossWeight: number;
  quantity: number;
  photoFileNames: { fileName: string; filePath: string; fileSize: number; mimeType: string }[];
  remarks?: string;
}

export interface InspectShipmentDto {
  inspectionItems: { itemId: string; passed: boolean; remark?: string }[];
  vehicleCleanConfirmed: boolean;
  photosVerified: boolean;
  overallResult: 'pass' | 'fail';
  remark?: string;
}

export interface ApproveShipmentDto {
  approved: boolean;
  remark?: string;
}

export interface ReturnForPhotoDto {
  remark: string;
}

export interface ResubmitPhotosDto {
  photoFileNames: { fileName: string; filePath: string; fileSize: number; mimeType: string }[];
  remark?: string;
}

const PACKING_RANK: Record<PackingGroup, number> = { I: 3, II: 2, III: 1 };

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(ShipmentRecord) private repo: Repository<ShipmentRecord>,
    @InjectRepository(ShipmentPhoto) private photoRepo: Repository<ShipmentPhoto>,
    @InjectRepository(ShipmentInspectionItem) private inspItemRepo: Repository<ShipmentInspectionItem>,
    @InjectRepository(DangerousGood) private dgRepo: Repository<DangerousGood>,
    @InjectRepository(Vehicle) private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(InspectionItem) private inspRepo: Repository<InspectionItem>,
  ) {}

  async create(dto: CreateShipmentDto, userId: string) {
    const dg = await this.dgRepo.findOneBy({ id: dto.dangerousGoodId });
    if (!dg) throw new NotFoundException('危险品不存在');

    if (dg.isForbidden) {
      throw new BadRequestException(`该品名（${dg.chineseName || dg.name}）为禁运品，不能受理`);
    }

    if (dg.requiredPackingGroup) {
      if (PACKING_RANK[dto.packingGroup] < PACKING_RANK[dg.requiredPackingGroup]) {
        throw new BadRequestException(
          `包装等级不匹配：要求${dg.requiredPackingGroup}级包装，实际为${dto.packingGroup}级，不能受理`,
        );
      }
    }

    const vehicle = await this.vehicleRepo.findOneBy({ id: dto.vehicleId });
    if (!vehicle) throw new NotFoundException('车辆不存在');
    if (!vehicle.inService) throw new BadRequestException('该车辆已停用');
    if (!vehicle.cleaned) {
      throw new BadRequestException('该车辆未完成清洗确认，不能装车');
    }

    if (!dto.photoFileNames || dto.photoFileNames.length === 0) {
      throw new BadRequestException('装载照片缺失，不能发运');
    }

    const packingMatched =
      !dg.requiredPackingGroup ||
      PACKING_RANK[dto.packingGroup] >= PACKING_RANK[dg.requiredPackingGroup];

    const record = this.repo.create({
      shipmentNo: 'WP' + Date.now().toString().slice(-10),
      ownerId: userId,
      dangerousGoodId: dto.dangerousGoodId,
      packingGroup: dto.packingGroup,
      packingMethod: dto.packingMethod,
      vehicleId: dto.vehicleId,
      grossWeight: dto.grossWeight,
      quantity: dto.quantity,
      status: 'draft',
      packingMatched,
      vehicleCleanConfirmed: vehicle.cleaned,
      photosVerified: false,
      photoStatus: 'complete' as PhotoStatus,
      photos: dto.photoFileNames.map((p) =>
        this.photoRepo.create({
          id: uuid(),
          fileName: p.fileName,
          filePath: p.filePath,
          fileSize: p.fileSize,
          mimeType: p.mimeType,
        }),
      ),
    });

    const saved = await this.repo.save(record);
    return this.findOne(saved.id);
  }

  async submit(id: string, userId: string) {
    const record = await this.findOne(id);
    if (!record) throw new NotFoundException('记录不存在');
    if (record.ownerId !== userId) throw new ForbiddenException('无权操作该记录');
    if (record.status !== 'draft') throw new BadRequestException('当前状态不能提交');

    if (!record.packingMatched) {
      throw new BadRequestException('包装等级不匹配，不能提交');
    }
    if (!record.vehicleCleanConfirmed) {
      throw new BadRequestException('车辆未完成清洗确认，不能提交');
    }
    if (!record.photos || record.photos.length === 0) {
      throw new BadRequestException('装载照片缺失，不能提交');
    }

    let nextStatus: ShipmentStatus = 'submitted';
    if (record.dangerousGood.isRestricted) {
      nextStatus = 'pending_approval';
    } else {
      nextStatus = 'submitted';
    }

    record.status = nextStatus;
    record.submittedAt = new Date();
    await this.repo.save(record);
    return this.findOne(id);
  }

  async inspect(id: string, dto: InspectShipmentDto, inspectorId: string) {
    const record = await this.findOne(id);
    if (!record) throw new NotFoundException('记录不存在');
    if (!['submitted', 'inspecting'].includes(record.status)) {
      throw new BadRequestException('当前状态不能执行检查');
    }

    if (!dto.vehicleCleanConfirmed) {
      throw new BadRequestException('车辆清洗未确认，不能通过检查');
    }
    if (!dto.photosVerified) {
      throw new BadRequestException('装载照片未核验通过，不能通过检查');
    }

    if (dto.inspectionItems) {
      await this.inspItemRepo.delete({ shipmentId: id });
      for (const item of dto.inspectionItems) {
        await this.inspItemRepo.save({
          shipmentId: id,
          inspectionItemId: item.itemId,
          passed: item.passed,
          remark: item.remark,
        });
      }
    }

    record.vehicleCleanConfirmed = dto.vehicleCleanConfirmed;
    record.photosVerified = dto.photosVerified;
    record.inspectionResult = dto.overallResult;
    record.inspectionRemark = dto.remark || null;
    record.freightInspectorId = inspectorId;
    record.inspectedAt = new Date();

    if (dto.overallResult === 'fail') {
      record.status = 'rejected';
    } else if (record.dangerousGood.isRestricted && record.status !== 'pending_approval') {
      record.status = 'pending_approval';
    } else {
      record.status = 'approved';
    }
    await this.repo.save(record);
    return this.findOne(id);
  }

  async returnForPhoto(id: string, dto: ReturnForPhotoDto, inspectorId: string) {
    const record = await this.findOne(id);
    if (!record) throw new NotFoundException('记录不存在');
    if (!['submitted', 'inspecting', 'pending_approval'].includes(record.status)) {
      throw new BadRequestException('当前状态不能退回补传照片');
    }

    record.status = 'photo_pending';
    record.photoStatus = 'pending_resubmit' as PhotoStatus;
    record.photoReturnRemark = dto.remark || null;
    record.photoReturnedAt = new Date();
    record.photoReturnedById = inspectorId;
    record.photosVerified = false;
    await this.repo.save(record);
    return this.findOne(id);
  }

  async resubmitPhotos(id: string, dto: ResubmitPhotosDto, ownerId: string) {
    const record = await this.findOne(id);
    if (!record) throw new NotFoundException('记录不存在');
    if (record.ownerId !== ownerId) throw new ForbiddenException('无权操作该记录');
    if (record.status !== 'photo_pending') {
      throw new BadRequestException('当前状态不能补传照片');
    }
    if (!dto.photoFileNames || dto.photoFileNames.length === 0) {
      throw new BadRequestException('请至少补传一张装载照片');
    }

    const newPhotos = dto.photoFileNames.map((p) =>
      this.photoRepo.create({
        id: uuid(),
        shipmentId: id,
        fileName: p.fileName,
        filePath: p.filePath,
        fileSize: p.fileSize,
        mimeType: p.mimeType,
      }),
    );
    await this.photoRepo.save(newPhotos);

    record.status = record.dangerousGood.isRestricted ? 'pending_approval' : 'submitted';
    record.photoStatus = 'complete' as PhotoStatus;
    record.photoResubmittedAt = new Date();
    record.photosVerified = false;
    await this.repo.save(record);
    return this.findOne(id);
  }

  async approve(id: string, dto: ApproveShipmentDto, supervisorId: string) {
    const record = await this.findOne(id);
    if (!record) throw new NotFoundException('记录不存在');
    if (record.status !== 'pending_approval') {
      throw new BadRequestException('当前状态不能审批');
    }
    if (record.photoStatus === 'pending_resubmit') {
      throw new BadRequestException('装载照片待补传，补传完成前不能审批发运');
    }

    record.supervisorApproved = dto.approved;
    record.supervisorRemark = dto.remark || null;
    record.supervisorId = supervisorId;
    record.approvedAt = new Date();
    record.status = dto.approved ? 'approved' : 'rejected';
    await this.repo.save(record);
    return this.findOne(id);
  }

  async ship(id: string, userId: string) {
    const record = await this.findOne(id);
    if (!record) throw new NotFoundException('记录不存在');
    if (record.status !== 'approved') {
      throw new BadRequestException('只有审核通过的记录才能发运');
    }
    record.status = 'shipped';
    record.shippedAt = new Date();
    await this.repo.save(record);
    return this.findOne(id);
  }

  findAll(query: {
    status?: ShipmentStatus;
    role?: 'owner' | 'freight' | 'supervisor';
    userId?: string;
    keyword?: string;
  }) {
    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.dangerousGood', 'dg')
      .leftJoinAndSelect('s.vehicle', 'v')
      .leftJoinAndSelect('s.owner', 'o')
      .leftJoinAndSelect('s.photos', 'p')
      .orderBy('s.createdAt', 'DESC');

    if (query.role === 'owner' && query.userId) {
      qb.andWhere('s.owner_id = :uid', { uid: query.userId });
    }
    if (query.status) {
      qb.andWhere('s.status = :status', { status: query.status });
    }
    if (query.keyword) {
      qb.andWhere(
        '(dg.chinese_name LIKE :kw OR s.shipment_no LIKE :kw OR v.plate_number LIKE :kw)',
        { kw: `%${query.keyword}%` },
      );
    }
    return qb.getMany();
  }

  async findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: [
        'dangerousGood',
        'vehicle',
        'owner',
        'freightInspector',
        'supervisor',
        'photoReturnedBy',
        'photos',
        'inspectionItemResults',
        'inspectionItemResults.inspectionItem',
      ],
    });
  }

  async getStatistics() {
    const total = await this.repo.count();
    const byStatus = await this.repo
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.status')
      .getRawMany();

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const monthCount = await this.repo
      .createQueryBuilder('s')
      .where('s.createdAt >= :d', { d: thisMonth })
      .getCount();

    return {
      total,
      thisMonth: monthCount,
      byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
    };
  }
}
