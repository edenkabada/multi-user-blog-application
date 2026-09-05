import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { FollowsService } from '../follows/follows.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let followsService: {
    getFollowerCount: jest.Mock;
    getFollowingCount: jest.Mock;
  };

  const registerDto: RegisterUserDto = {
    username: 'alon',
    email: 'alon@example.com',
    password: 'password123',
  };

  const makeDuplicateEntryError = () => {
    const error = new QueryFailedError('', [], new Error('Duplicate entry'));
    (error as unknown as { driverError: { code: string } }).driverError = {
      code: 'ER_DUP_ENTRY',
    };
    return error;
  };

  beforeEach(async () => {
    followsService = {
      getFollowerCount: jest.fn().mockResolvedValue(0),
      getFollowingCount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: FollowsService,
          useValue: followsService,
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

  describe('register', () => {
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

    it('throws ConflictException naming the username when that is what conflicts', async () => {
      repository.create.mockReturnValue({ ...registerDto } as User);
      repository.save.mockRejectedValue(makeDuplicateEntryError());
      // The service re-queries by username/email to find which one actually
      // conflicts, rather than parsing the DB error message.
      repository.findOne.mockResolvedValue({
        username: registerDto.username,
        email: 'someone-else@example.com',
      } as User);

      await expect(service.register(registerDto)).rejects.toThrow(
        'Username already exists',
      );
    });

    it('throws ConflictException naming the email when that is what conflicts', async () => {
      repository.create.mockReturnValue({ ...registerDto } as User);
      repository.save.mockRejectedValue(makeDuplicateEntryError());
      repository.findOne.mockResolvedValue({
        username: 'someone-else',
        email: registerDto.email,
      } as User);

      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already exists',
      );
    });

    it('throws a generic ConflictException if the conflicting row cannot be found', async () => {
      repository.create.mockReturnValue({ ...registerDto } as User);
      repository.save.mockRejectedValue(makeDuplicateEntryError());
      repository.findOne.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows unexpected errors', async () => {
      repository.create.mockReturnValue({ ...registerDto } as User);
      repository.save.mockRejectedValue(new Error('connection lost'));

      await expect(service.register(registerDto)).rejects.toThrow(
        'connection lost',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginUserDto = {
      username: 'alon',
      password: 'password123',
    };

    it('returns an access token including the user role', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      repository.findOne.mockResolvedValue({
        userId: 1,
        username: loginDto.username,
        password: hashedPassword,
        role: 'user',
      } as User);
      jwtService.sign.mockReturnValue('signed-jwt');

      const result = await service.login(loginDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: loginDto.username },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        username: loginDto.username,
        role: 'user',
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
        role: 'user',
      } as User);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the account is blocked', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      repository.findOne.mockResolvedValue({
        userId: 1,
        username: loginDto.username,
        password: hashedPassword,
        role: 'user',
        isBlocked: true,
      } as User);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('findAllForAdmin', () => {
    it('returns every user without their password', async () => {
      repository.find.mockResolvedValue([
        { userId: 1, username: 'alon', password: 'hashed' } as User,
        { userId: 2, username: 'eden', password: 'hashed' } as User,
      ]);

      const result = await service.findAllForAdmin();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
    });
  });

  describe('setBlocked', () => {
    it('updates and returns the user without their password', async () => {
      const existingUser = {
        userId: 1,
        username: 'alon',
        password: 'hashed',
        isBlocked: false,
      } as User;
      repository.findOne.mockResolvedValue(existingUser);
      repository.save.mockResolvedValue({ ...existingUser, isBlocked: true });

      const result = await service.setBlocked(1, true);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isBlocked: true }),
      );
      expect(result).not.toHaveProperty('password');
      expect(result.isBlocked).toBe(true);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.setBlocked(999, true)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findMe', () => {
    it('returns the profile fields for the authenticated user, without the password, including follow counts', async () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');
      repository.findOne.mockResolvedValue({
        userId: 1,
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        role: 'user',
        isBlocked: false,
        createdAt,
        updatedAt: null,
      } as User);
      followsService.getFollowerCount.mockResolvedValue(4);
      followsService.getFollowingCount.mockResolvedValue(2);

      const result = await service.findMe(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
      expect(followsService.getFollowerCount).toHaveBeenCalledWith(1);
      expect(followsService.getFollowingCount).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        userId: 1,
        username: 'alice',
        email: 'alice@example.com',
        role: 'user',
        createdAt,
        followerCount: 4,
        followingCount: 2,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findMe(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPublicProfile', () => {
    it('returns only public fields for an existing user, including follow counts', async () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');
      repository.findOne.mockResolvedValue({
        userId: 2,
        username: 'bob',
        email: 'bob@example.com',
        password: 'hashed-password',
        role: 'user',
        isBlocked: false,
        createdAt,
        updatedAt: null,
      } as User);
      followsService.getFollowerCount.mockResolvedValue(7);
      followsService.getFollowingCount.mockResolvedValue(1);

      const result = await service.findPublicProfile(2);

      expect(followsService.getFollowerCount).toHaveBeenCalledWith(2);
      expect(followsService.getFollowingCount).toHaveBeenCalledWith(2);
      expect(result).toEqual({
        userId: 2,
        username: 'bob',
        role: 'user',
        createdAt,
        followerCount: 7,
        followingCount: 1,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('email');
    });

    it('throws NotFoundException when the user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findPublicProfile(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException for a non-numeric id instead of querying with NaN', async () => {
      await expect(service.findPublicProfile(NaN)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('userExists', () => {
    it('returns true when a user with that id exists', async () => {
      repository.findOne.mockResolvedValue({ userId: 1 } as User);

      const result = await service.userExists(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
        select: { userId: true },
      });
      expect(result).toBe(true);
    });

    it('returns false when no user with that id exists', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.userExists(999);

      expect(result).toBe(false);
    });

    it('returns false for a non-numeric id without querying the database', async () => {
      const result = await service.userExists(NaN);

      expect(result).toBe(false);
      expect(repository.findOne).not.toHaveBeenCalled();
    });
  });
});
