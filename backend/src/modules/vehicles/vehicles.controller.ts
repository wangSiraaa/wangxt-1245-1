import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { Roles } from '../../common/roles.decorator';

@ApiTags('车辆')
@Controller('vehicles')
export class VehiclesController {
  constructor(private service: VehiclesService) {}

  @Get()
  @Roles('owner', 'freight', 'supervisor')
  findAll(@Query('status') status?: 'cleaned' | 'available') {
    return this.service.findAll(status);
  }

  @Get(':id')
  @Roles('owner', 'freight', 'supervisor')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/confirm-clean')
  @Roles('freight')
  confirmClean(@Param('id') id: string) {
    return this.service.confirmClean(id);
  }
}
