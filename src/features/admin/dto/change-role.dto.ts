import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export enum UserRole {
  Admin = 'admin',
  Moderator = 'moderator',
  StatsViewer = 'stats_viewer',
  User = 'user',
}

export class ChangeRoleDto {
  @IsNotEmpty()
  @IsArray()
  usersToChangeRole!: string[];

  @IsNotEmpty()
  @IsEnum(UserRole, {
    message:
      'Invalid user role. Allowed values are "admin", "moderator", "stats_viewer", "user.',
  })
  role!: 'admin' | 'moderator' | 'stats_viewer' | 'user';
}
