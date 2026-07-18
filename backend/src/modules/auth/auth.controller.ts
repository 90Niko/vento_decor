import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, CreatorSession } from './auth.service';
import { CREATOR_COOKIE, CreatorAuthGuard } from './creator-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.register(dto);
    response.cookie(CREATOR_COOKIE, result.token, cookieOptions);
    return { creator: result.creator };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    response.cookie(CREATOR_COOKIE, result.token, cookieOptions);
    return { creator: result.creator };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(CREATOR_COOKIE, { path: '/' });
    return { success: true };
  }

  @Get('me')
  @UseGuards(CreatorAuthGuard)
  me(@Req() request: Request & { creator: CreatorSession }) {
    return { creator: request.creator };
  }
}
