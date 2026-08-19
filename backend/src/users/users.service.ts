import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
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

  async login(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = {
      sub: user.userId,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }

  private isDuplicateEntryError(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as { driverError?: { code?: string } }).driverError?.code ===
        'ER_DUP_ENTRY'
    );
  }
}
