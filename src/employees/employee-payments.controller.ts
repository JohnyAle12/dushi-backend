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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateEmployeePaymentDto } from './dto/create-employee-payment.dto';
import { UpdateEmployeePaymentDto } from './dto/update-employee-payment.dto';
import { EmployeePaymentsService } from './employee-payments.service';

@UseGuards(JwtAuthGuard)
@Controller('employee-payments')
export class EmployeePaymentsController {
  constructor(
    private readonly employeePaymentsService: EmployeePaymentsService,
  ) {}

  @Post()
  create(
    @Req() req: { user: AuthUser },
    @Body() createEmployeePaymentDto: CreateEmployeePaymentDto,
  ) {
    return this.employeePaymentsService.create(
      createEmployeePaymentDto,
      req.user.storeId,
    );
  }

  @Get()
  findAll(
    @Req() req: { user: AuthUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('employeeId') employeeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('hasBonus') hasBonus?: string,
  ) {
    return this.employeePaymentsService.findAll(
      req.user.storeId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      employeeId,
      startDate,
      endDate,
      this.parseHasBonus(hasBonus),
    );
  }

  @Get('totals')
  getTotals(
    @Req() req: { user: AuthUser },
    @Query('employeeId') employeeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('hasBonus') hasBonus?: string,
  ) {
    return this.employeePaymentsService.getTotals(
      req.user.storeId,
      employeeId,
      startDate,
      endDate,
      this.parseHasBonus(hasBonus),
    );
  }

  @Get(':id')
  findOne(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.employeePaymentsService.findOne(id, req.user.storeId);
  }

  @Patch(':id')
  update(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() updateEmployeePaymentDto: UpdateEmployeePaymentDto,
  ) {
    return this.employeePaymentsService.update(
      id,
      req.user.storeId,
      updateEmployeePaymentDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.employeePaymentsService.remove(id, req.user.storeId);
  }

  private parseHasBonus(hasBonus?: string): boolean | undefined {
    if (hasBonus === undefined) return undefined;
    if (hasBonus === 'true') return true;
    if (hasBonus === 'false') return false;
    return undefined;
  }
}
