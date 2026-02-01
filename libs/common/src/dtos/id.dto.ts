import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class IdDto {
  @IsNotEmpty({ message: 'Id is required' })
  @IsNumber({}, { message: 'Id must be a number' })
  @IsPositive({ message: 'Id must be a positive number' })
  @Type(() => Number)
  id: number;
}
