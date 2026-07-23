import { IsInt, IsNotEmpty, IsPositive, IsUUID } from 'class-validator';

export class RemoveRoleDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  roleId: number;
}
