import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './users/user.entity';
import { Project } from './projects/project.entity';
import { Task } from './tasks/task.entity';
import { Issue } from './issues/issue.entity';
import { Notification } from './notifications/notification.entity';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { IssuesModule } from './issues/issues.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'task_management'),
        entities: [User, Project, Task, Issue, Notification],
        synchronize: true, 
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ProjectsModule,
    TasksModule,
    IssuesModule,
    NotificationsModule,
    AuthModule,
    // We'll add other modules later
  ],
})
export class AppModule {}