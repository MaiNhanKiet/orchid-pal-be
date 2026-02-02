import { IsArray, IsNotEmpty, IsPositive } from 'class-validator';

export class AssignPermissionsDto {
  @IsNotEmpty()
  @IsPositive()
  roleId: number;

  @IsArray()
  @IsPositive({ each: true })
  permissionIds: number[];
}
