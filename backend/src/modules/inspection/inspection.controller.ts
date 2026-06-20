import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InspectionService } from './inspection.service';
import { Roles } from '../../common/roles.decorator';

@ApiTags('检查项')
@Controller('inspection-items')
export class InspectionController {
  constructor(private service: InspectionService) {}

  @Get()
  @Roles('freight', 'supervisor', 'owner')
  findAll(@Query('category') category?: string) {
    if (category) return this.service.findByCategory(category);
    return this.service.findAll();
  }
}
