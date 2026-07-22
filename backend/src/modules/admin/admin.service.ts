import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listCreators() {
    const creators = await this.prisma.creators.findMany({
      where: { role: 'CREATOR' },
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { events: true } } },
    });
    return creators.map((creator) => ({
      id: creator.id,
      name: creator.name,
      email: creator.email,
      isActive: creator.is_active,
      eventCount: creator._count.events,
      createdAt: creator.created_at,
    }));
  }

  async setCreatorActive(id: number, isActive: boolean) {
    const creator = await this.prisma.creators.findFirst({
      where: { id, role: 'CREATOR' },
    });
    if (!creator) throw new NotFoundException('Creator профилът не е намерен.');
    if (creator.role === 'ADMIN')
      throw new BadRequestException('Admin профилът не може да бъде блокиран.');
    return this.prisma.creators.update({
      where: { id },
      data: { is_active: isActive },
      select: { id: true, is_active: true },
    });
  }
}
