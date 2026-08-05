import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateEmployeePaymentDto } from './dto/create-employee-payment.dto';
import { UpdateEmployeePaymentDto } from './dto/update-employee-payment.dto';
import { EmployeePayment } from './entities/employee-payment.entity';
import { EmployeesService } from './employees.service';

@Injectable()
export class EmployeePaymentsService {
  constructor(
    @InjectRepository(EmployeePayment)
    private readonly employeePaymentsRepository: Repository<EmployeePayment>,
    private readonly employeesService: EmployeesService,
  ) {}

  async create(
    createEmployeePaymentDto: CreateEmployeePaymentDto,
    storeId: string,
  ): Promise<EmployeePayment> {
    await this.employeesService.findOne(
      createEmployeePaymentDto.employeeId,
      storeId,
    );

    const payment = this.employeePaymentsRepository.create({
      ...createEmployeePaymentDto,
      bonus: createEmployeePaymentDto.bonus ?? 0,
      storeId,
    });
    return this.employeePaymentsRepository.save(payment);
  }

  async findAll(
    storeId: string,
    page = 1,
    limit = 10,
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    hasBonus?: boolean,
  ): Promise<{
    data: EmployeePayment[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('page must be a positive integer');
    }
    if (!Number.isInteger(limit) || limit < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }
    this.assertFiltersValid(startDate, endDate);

    const qb = this.employeePaymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.employee', 'employee')
      .orderBy('payment.paymentDate', 'DESC')
      .addOrderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyFilters(qb, storeId, employeeId, startDate, endDate, hasBonus);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTotals(
    storeId: string,
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    hasBonus?: boolean,
  ): Promise<{
    paymentCount: number;
    totalAmount: number;
    totalBonus: number;
    grandTotal: number;
  }> {
    this.assertFiltersValid(startDate, endDate);

    const qb = this.employeePaymentsRepository
      .createQueryBuilder('payment')
      .select('COUNT(payment.id)', 'paymentCount')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'totalAmount')
      .addSelect('COALESCE(SUM(payment.bonus), 0)', 'totalBonus');

    this.applyFilters(qb, storeId, employeeId, startDate, endDate, hasBonus);

    const row = await qb.getRawOne<{
      paymentCount: string;
      totalAmount: string;
      totalBonus: string;
    }>();

    const totalAmount = Number.parseFloat(row.totalAmount);
    const totalBonus = Number.parseFloat(row.totalBonus);

    return {
      paymentCount: Number.parseInt(row.paymentCount, 10),
      totalAmount,
      totalBonus,
      grandTotal: Math.round((totalAmount + totalBonus) * 100) / 100,
    };
  }

  async findOne(id: string, storeId: string): Promise<EmployeePayment> {
    const payment = await this.employeePaymentsRepository.findOne({
      where: { id, storeId },
      relations: ['employee'],
    });
    if (!payment) {
      throw new NotFoundException(`Employee payment with id "${id}" not found`);
    }
    return payment;
  }

  async update(
    id: string,
    storeId: string,
    updateEmployeePaymentDto: UpdateEmployeePaymentDto,
  ): Promise<EmployeePayment> {
    const payment = await this.findOne(id, storeId);

    if (updateEmployeePaymentDto.employeeId) {
      await this.employeesService.findOne(
        updateEmployeePaymentDto.employeeId,
        storeId,
      );
    }

    Object.assign(payment, updateEmployeePaymentDto);
    return this.employeePaymentsRepository.save(payment);
  }

  async remove(id: string, storeId: string): Promise<void> {
    const payment = await this.findOne(id, storeId);
    await this.employeePaymentsRepository.softRemove(payment);
  }

  private applyFilters(
    qb: SelectQueryBuilder<EmployeePayment>,
    storeId: string,
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    hasBonus?: boolean,
  ): void {
    qb.where('payment.storeId = :storeId', { storeId }).andWhere(
      'payment.deletedAt IS NULL',
    );

    if (employeeId) {
      qb.andWhere('payment.employeeId = :employeeId', { employeeId });
    }

    if (startDate && endDate) {
      qb.andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      qb.andWhere('payment.paymentDate >= :startDate', { startDate });
    } else if (endDate) {
      qb.andWhere('payment.paymentDate <= :endDate', { endDate });
    }

    if (hasBonus === true) {
      qb.andWhere('payment.bonus > 0');
    } else if (hasBonus === false) {
      qb.andWhere('payment.bonus = 0');
    }
  }

  private assertFiltersValid(startDate?: string, endDate?: string): void {
    if (startDate && !this.isValidDateFormat(startDate)) {
      throw new BadRequestException('startDate must use format YYYY-MM-DD');
    }
    if (endDate && !this.isValidDateFormat(endDate)) {
      throw new BadRequestException('endDate must use format YYYY-MM-DD');
    }
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }
  }

  private isValidDateFormat(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }
}
