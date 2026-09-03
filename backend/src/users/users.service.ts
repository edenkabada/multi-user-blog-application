import {
  Injectable,
  UnauthorizedException,
  ConflictException,
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

  // Register a new user and save the user data in the database
  async register(registerUserDto: RegisterUserDto) {
    const { username, email, password } = registerUserDto;

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    try {
      const savedUser = await this.userRepository.save(user);

      // Remove the password from the response
      const { password: _password, ...result } = savedUser;
      return result;
    } catch (error) {
      // Handle duplicate username or email errors
      if (this.isDuplicateEntryError(error)) {
        if (error.message.includes('users.username')) {
          throw new ConflictException('Username already exists');
        }
        if (error.message.includes('users.email')) {
          throw new ConflictException('Email already exists');
        }
        throw new ConflictException('Username or email is already taken');
      }

      throw error;
    }
  }

  // Authenticate the user and generate an access token
  async login(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Compare the entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Create the JWT payload with the user's information
    const payload = {
      sub: user.userId,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }

  private isDuplicateEntryError(error: unknown): error is QueryFailedError {
    return (
      error instanceof QueryFailedError &&
      (error as { driverError?: { code?: string } }).driverError?.code ===
        'ER_DUP_ENTRY'
    );
  }
}
