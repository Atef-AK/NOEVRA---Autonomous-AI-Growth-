import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ROLES, Role } from '@growthos/shared';

export class InviteMemberDto {
  @ApiProperty({ example: 'colleague@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: Object.values(ROLES), example: 'member' })
  @IsEnum(Object.values(ROLES) as Role[])
  role!: Role;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['admin', 'manager', 'member', 'viewer'] })
  @IsEnum(['admin', 'manager', 'member', 'viewer'])
  role!: Role;
}

export class AcceptInviteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  token!: string;
}
