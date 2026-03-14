import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';
import { SalesModule } from '../sales/sales.module';
import { SeedSalesService } from './seed-sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Store]),
    SalesModule,
  ],
  providers: [SeedSalesService],
  exports: [SeedSalesService],
})
export class SeedModule {}
