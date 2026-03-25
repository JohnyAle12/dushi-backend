import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IdentificationType } from '../../common/enums/identification-type.enum';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(IdentificationType)
  identificationType: IdentificationType;

  @IsString()
  @IsNotEmpty()
  identificationNumber: string;

  @IsOptional()
  email?: string;
}
