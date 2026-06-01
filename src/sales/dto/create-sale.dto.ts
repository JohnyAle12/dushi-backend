import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { CreateSaleItemDto } from './create-sale-item.dto';

export class CreateSaleDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tax: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ValidateIf((o: CreateSaleDto) => o.paymentMethod === PaymentMethod.RAPPI)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  rappiOrderId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  amountPaid?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  change?: number;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  prefix?: string;

  @IsUUID('4')
  @IsOptional()
  customerId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
