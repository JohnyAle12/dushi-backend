import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
  ) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
    storeId: string,
  ): Promise<Employee> {
    const employee = this.employeesRepository.create({
      ...createEmployeeDto,
      storeId,
    });
    return this.employeesRepository.save(employee);
  }

  async findAll(storeId: string): Promise<Employee[]> {
    return this.employeesRepository.find({
      where: { storeId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, storeId: string): Promise<Employee> {
    const employee = await this.employeesRepository.findOneBy({ id, storeId });
    if (!employee) {
      throw new NotFoundException(`Employee with id "${id}" not found`);
    }
    return employee;
  }

  async update(
    id: string,
    storeId: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOne(id, storeId);
    Object.assign(employee, updateEmployeeDto);
    return this.employeesRepository.save(employee);
  }

  async remove(id: string, storeId: string): Promise<void> {
    const employee = await this.findOne(id, storeId);
    await this.employeesRepository.softRemove(employee);
  }

  async restore(id: string, storeId: string): Promise<Employee> {
    const employee = await this.employeesRepository.findOne({
      where: { id, storeId },
      withDeleted: true,
    });
    if (!employee) {
      throw new NotFoundException(`Employee with id "${id}" not found`);
    }
    if (!employee.deletedAt) {
      throw new ConflictException('Employee is not deleted');
    }
    await this.employeesRepository.restore(id);
    return this.findOne(id, storeId);
  }
}
