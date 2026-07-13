import { Module } from '@nestjs/common';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { CloudinaryModule } from '../infrastructure/storage/cloudinary/cloudinary.module';
import { EventsModule } from '../modules/events/events.module';
import { EventImagesRepository } from './domain/event-images.repository';
import { EventUploadsController } from './event-uploads.controller';
import { PrismaEventImagesRepository } from './infrastructure/prisma-event-images.repository';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { AdminEventImagesController } from './admin-event-images.controller';

@Module({
  imports: [CloudinaryModule, DatabaseModule, EventsModule],
  controllers: [
    UploadsController,
    EventUploadsController,
    AdminEventImagesController,
  ],
  providers: [
    UploadsService,
    {
      provide: EventImagesRepository,
      useClass: PrismaEventImagesRepository,
    },
  ],
})
export class UploadsModule {}
