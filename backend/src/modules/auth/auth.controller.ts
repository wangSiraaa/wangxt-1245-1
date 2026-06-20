import { Controller, Post, Body, Get, HttpCode, HttpStatus, SetMetadata } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsNotEmpty, IsString } from 'class-validator';

class LoginDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() password: string;
  @IsString() @IsNotEmpty() role: 'owner' | 'freight' | 'supervisor';
}

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @SetMetadata('isPublic', true)
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password, dto.role);
  }

  @Get('demo-users')
  @SetMetadata('isPublic', true)
  demoUsers() {
    return this.authService.getPublicUsers();
  }
}
