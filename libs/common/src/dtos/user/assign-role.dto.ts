import { IsInt, IsNotEmpty, IsUUID, IsPositive } from 'class-validator';

export class AssignRoleDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  roleId: number;
}
