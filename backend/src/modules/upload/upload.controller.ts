import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';
import { Roles } from '../../common/roles.decorator';
import { UploadService } from './upload.service';

@ApiTags('文件上传')
@Controller('upload')
export class UploadController {
  constructor(private service: UploadService) {}

  @Post('photo')
  @Roles('owner', 'freight')
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    return {
      fileId: file.filename,
      fileName: file.originalname,
      url: this.service.getFileUrl(file.filename),
      size: file.size,
    };
  }

  @Get(':filename')
  @Roles('owner', 'freight', 'supervisor')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    res.sendFile(join(process.cwd(), 'uploads', filename));
  }
}
