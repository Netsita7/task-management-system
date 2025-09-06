import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './project.entity';
import { ProjectMember } from './project-member.entity';
import { ProjectInvitation } from './invitation.entity';
import { User } from '../users/user.entity';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleAdjustment } from '../schedule/schedule-adjustment.entity';
import { ScheduleAdjustmentService } from '../schedule/schedule-adjustment.service';
import { ScheduleAdjustmentController } from '../schedule/schedule-adjustment.controller';
import { Task } from '../tasks/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, ProjectInvitation, User, ScheduleAdjustment, Task]),
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ProjectsController, ScheduleAdjustmentController],
  providers: [ProjectsService, ScheduleAdjustmentService],
  exports: [ProjectsService],
})
export class ProjectsModule {}