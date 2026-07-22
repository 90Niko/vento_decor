import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminService } from './admin.service';

class SetCreatorActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

@Controller('admin/creators')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  listCreators() {
    return this.adminService.listCreators();
  }

  @Patch(':id/status')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetCreatorActiveDto,
  ) {
    return this.adminService.setCreatorActive(id, dto.isActive);
  }
}
