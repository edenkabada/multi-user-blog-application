import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const registerDto: RegisterUserDto = {
    username: 'alon',
    email: 'alon@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hashes the password before saving and never returns it', async () => {
    const createdUser = { ...registerDto, userId: 1 } as User;
    repository.create.mockReturnValue(createdUser);
    repository.save.mockResolvedValue({
      ...createdUser,
      password: 'hashed-password',
    });

    const result = await service.register(registerDto);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: registerDto.username,
        email: registerDto.email,
      }),
    );
    const savedPassword = repository.create.mock.calls[0][0].password;
    expect(savedPassword).not.toBe(registerDto.password);
    expect(
      await bcrypt.compare(registerDto.password, savedPassword as string),
    ).toBe(true);
    expect(result).not.toHaveProperty('password');
  });

  it('throws a ConflictException when the username or email is already taken', async () => {
    repository.create.mockReturnValue({ ...registerDto } as User);
    const duplicateError = new QueryFailedError(
      '',
      [],
      new Error('Duplicate entry'),
    );
    (
      duplicateError as unknown as { driverError: { code: string } }
    ).driverError = {
      code: 'ER_DUP_ENTRY',
    };
    repository.save.mockRejectedValue(duplicateError);

    await expect(service.register(registerDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rethrows unexpected errors', async () => {
    repository.create.mockReturnValue({ ...registerDto } as User);
    const unexpectedError = new Error('connection lost');
    repository.save.mockRejectedValue(unexpectedError);

    await expect(service.register(registerDto)).rejects.toThrow(
      'connection lost',
    );
  });

  describe('login', () => {
    const loginDto: LoginUserDto = {
      username: 'alon',
      password: 'password123',
    };

    it('returns an access token when credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      repository.findOne.mockResolvedValue({
        userId: 1,
        username: loginDto.username,
        password: hashedPassword,
      } as User);
      jwtService.sign.mockReturnValue('signed-jwt');

      const result = await service.login(loginDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: loginDto.username },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        username: loginDto.username,
      });
      expect(result).toEqual({ access_token: 'signed-jwt' });
    });

    it('throws UnauthorizedException when the username is unknown', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('a-different-password', 10);
      repository.findOne.mockResolvedValue({
        userId: 1,
        username: loginDto.username,
        password: hashedPassword,
      } as User);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
