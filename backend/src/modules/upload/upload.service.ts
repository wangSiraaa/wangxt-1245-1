import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  getFileUrl(filename: string) {
    return `/uploads/${filename}`;
  }
}
