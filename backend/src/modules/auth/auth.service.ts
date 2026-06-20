import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string, role: string) {
    const user = await this.usersRepo.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.role !== role) {
      throw new UnauthorizedException('该角色与账号不匹配');
    }
    const payload = { sub: user.id, username: user.username, role: user.role, name: user.name };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken: 'refresh-' + user.id,
      user: { id: user.id, username: user.username, role: user.role, name: user.name },
    };
  }

  async getPublicUsers() {
    const users = await this.usersRepo.find();
    return users.map(u => ({ username: u.username, name: u.name, role: u.role }));
  }
}
