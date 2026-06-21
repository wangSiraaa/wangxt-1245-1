import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ShipmentsService,
  CreateShipmentDto,
  InspectShipmentDto,
  ApproveShipmentDto,
  ReturnForPhotoDto,
  ResubmitPhotosDto,
} from './shipments.service';
import { Roles } from '../../common/roles.decorator';
import { ShipmentStatus } from '../../entities/shipment-record.entity';

interface RequestWithUser {
  user: { sub: string; username: string; role: string; name: string };
}

@ApiTags('发运记录')
@Controller('shipments')
export class ShipmentsController {
  constructor(private service: ShipmentsService) {}

  @Post()
  @Roles('owner')
  create(@Body() dto: CreateShipmentDto, @Req() req: RequestWithUser) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @Roles('owner', 'freight', 'supervisor')
  findAll(
    @Query('status') status?: ShipmentStatus,
    @Query('keyword') keyword?: string,
    @Req() req?: RequestWithUser,
  ) {
    return this.service.findAll({
      status,
      role: req.user.role as 'owner' | 'freight' | 'supervisor',
      userId: req.user.sub,
      keyword,
    });
  }

  @Get('statistics')
  @Roles('supervisor', 'freight', 'owner')
  statistics() {
    return this.service.getStatistics();
  }

  @Get(':id')
  @Roles('owner', 'freight', 'supervisor')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/submit')
  @Roles('owner')
  submit(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.service.submit(id, req.user.sub);
  }

  @Post(':id/inspect')
  @Roles('freight')
  inspect(
    @Param('id') id: string,
    @Body() dto: InspectShipmentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.inspect(id, dto, req.user.sub);
  }

  @Post(':id/return-photos')
  @Roles('freight')
  returnForPhoto(
    @Param('id') id: string,
    @Body() dto: ReturnForPhotoDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.returnForPhoto(id, dto, req.user.sub);
  }

  @Post(':id/resubmit-photos')
  @Roles('owner')
  resubmitPhotos(
    @Param('id') id: string,
    @Body() dto: ResubmitPhotosDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.resubmitPhotos(id, dto, req.user.sub);
  }

  @Post(':id/approve')
  @Roles('supervisor')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveShipmentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.approve(id, dto, req.user.sub);
  }

  @Post(':id/ship')
  @Roles('freight')
  ship(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.service.ship(id, req.user.sub);
  }
}
