import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DangerousGoodsService } from './dangerous-goods.service';
import { Roles } from '../../common/roles.decorator';

@ApiTags('危险品目录')
@Controller('dangerous-goods')
export class DangerousGoodsController {
  constructor(private service: DangerousGoodsService) {}

  @Get()
  @Roles('owner', 'freight', 'supervisor')
  findAll(@Query('keyword') keyword?: string) {
    return this.service.findAll(keyword);
  }

  @Get(':id')
  @Roles('owner', 'freight', 'supervisor')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
