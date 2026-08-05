import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeePaymentsController } from './employee-payments.controller';
import { EmployeePaymentsService } from './employee-payments.service';
import { EmployeePayment } from './entities/employee-payment.entity';
import { Employee } from './entities/employee.entity';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, EmployeePayment])],
  controllers: [EmployeesController, EmployeePaymentsController],
  providers: [EmployeesService, EmployeePaymentsService],
  exports: [EmployeesService, EmployeePaymentsService],
})
export class EmployeesModule {}
