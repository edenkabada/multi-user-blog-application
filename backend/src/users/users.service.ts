import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { username, email, password } = registerUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    try {
      const savedUser = await this.userRepository.save(user);
      const { password: _password, ...result } = savedUser;
      return result;
    } catch (error) {
      if (this.isDuplicateEntryError(error)) {
        throw new ConflictException('Username or email is already taken');
      }
      throw error;
    }
  }

  private isDuplicateEntryError(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as { driverError?: { code?: string } }).driverError?.code ===
        'ER_DUP_ENTRY'
    );
  }
}

