import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const scryptAsync = promisify(scrypt);
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export interface CreatorSession {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const configuredSecret = config.get<string>('AUTH_SECRET', '');
    if (process.env.NODE_ENV === 'production' && configuredSecret.length < 32) {
      throw new Error('AUTH_SECRET must contain at least 32 characters.');
    }
    this.secret =
      configuredSecret || 'vento-decor-development-secret-change-in-production';
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.creators.findUnique({ where: { email } })) {
      throw new ConflictException('Вече има профил с този имейл.');
    }
    const creator = await this.prisma.creators.create({
      data: {
        name: dto.name.trim(),
        email,
        password_hash: await this.hashPassword(dto.password),
      },
    });
    return this.createSession(creator);
  }

  async login(dto: LoginDto) {
    const creator = await this.prisma.creators.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (
      !creator ||
      !(await this.verifyPassword(dto.password, creator.password_hash))
    ) {
      throw new UnauthorizedException('Невалиден имейл или парола.');
    }
    return this.createSession(creator);
  }

  verifySession(token: string | undefined): CreatorSession | null {
    if (!token) return null;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const actual = Buffer.from(signature);
    const expected = Buffer.from(this.sign(payload));
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    try {
      const data = JSON.parse(
        Buffer.from(payload, 'base64url').toString(),
      ) as CreatorSession & { exp: number };
      if (data.exp < Math.floor(Date.now() / 1000)) return null;
      return { id: data.id, name: data.name, email: data.email };
    } catch {
      return null;
    }
  }

  private createSession(creator: CreatorSession) {
    const safeCreator = {
      id: creator.id,
      name: creator.name,
      email: creator.email,
    };
    const payload = Buffer.from(
      JSON.stringify({
        ...safeCreator,
        exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
      }),
    ).toString('base64url');
    return { creator: safeCreator, token: `${payload}.${this.sign(payload)}` };
  }

  private sign(payload: string) {
    return createHmac('sha256', this.secret)
      .update(payload)
      .digest('base64url');
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;
    return `scrypt:${salt}:${hash.toString('hex')}`;
  }

  private async verifyPassword(password: string, stored: string) {
    const [algorithm, salt, hash] = stored.split(':');
    if (algorithm !== 'scrypt' || !salt || !hash) return false;
    const actual = (await scryptAsync(password, salt, 64)) as Buffer;
    const expected = Buffer.from(hash, 'hex');
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}
