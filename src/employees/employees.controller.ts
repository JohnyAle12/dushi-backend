import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(
    @Req() req: { user: AuthUser },
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(createEmployeeDto, req.user.storeId);
  }

  @Get()
  findAll(@Req() req: { user: AuthUser }) {
    return this.employeesService.findAll(req.user.storeId);
  }

  @Get(':id')
  findOne(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.employeesService.findOne(id, req.user.storeId);
  }

  @Patch(':id')
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(
      id,
      req.user.storeId,
      updateEmployeeDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.employeesService.remove(id, req.user.storeId);
  }

  @Patch(':id/restore')
  restore(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.employeesService.restore(id, req.user.storeId);
  }
}
