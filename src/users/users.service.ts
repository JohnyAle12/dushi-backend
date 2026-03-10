import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { STORES } from '../common/constants/stores.constant';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private users: Map<string, User> = new Map();

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const store = STORES.find((s) => s.id === createUserDto.storeId);
    if (!store) {
      throw new NotFoundException(
        `Store with id "${createUserDto.storeId}" not found`,
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const now = new Date();
    const user: User = {
      id: randomUUID(),
      ...createUserDto,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  findAll(): Omit<User, 'password'>[] {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Array.from(this.users.values()).map(({ password, ...user }) => user);
  }

  findOne(id: string): Omit<User, 'password'> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  findByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = this.findByEmail(updateUserDto.email);
      if (existing) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    if (updateUserDto.storeId) {
      const store = STORES.find((s) => s.id === updateUserDto.storeId);
      if (!store) {
        throw new NotFoundException(
          `Store with id "${updateUserDto.storeId}" not found`,
        );
      }
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    const updated: User = {
      ...user,
      ...updateUserDto,
      updatedAt: new Date(),
    };

    this.users.set(id, updated);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updated;
    return result;
  }

  remove(id: string): void {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    this.users.delete(id);
  }
}
