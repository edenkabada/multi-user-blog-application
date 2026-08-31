import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { FollowsService } from '../follows/follows.service';

// Shape of the query object passed to userRepository.findOne() in these
// tests, just enough to type-narrow the mockImplementation callbacks below.
type FindOneQuery = {
  where: { userId?: number; username?: string; email?: string };
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: { findOne: jest.Mock; save: jest.Mock };
  let followsService: {
    getFollowerCount: jest.Mock;
    getFollowingCount: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    followsService = {
      getFollowerCount: jest.fn().mockResolvedValue(0),
      getFollowingCount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
        {
          provide: FollowsService,
          useValue: followsService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findMe', () => {
    it('returns the profile fields for the authenticated user, without the password, including follow counts', async () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');
      userRepository.findOne.mockResolvedValue({
        userId: 1,
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        role: 'user',
        isBlocked: false,
        createdAt,
        updatedAt: null,
      });
      followsService.getFollowerCount.mockResolvedValue(4);
      followsService.getFollowingCount.mockResolvedValue(2);

      const result = await service.findMe(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
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
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findMe(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPublicProfile', () => {
    it('returns only public fields for an existing user, including follow counts', async () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');
      userRepository.findOne.mockResolvedValue({
        userId: 2,
        username: 'bob',
        email: 'bob@example.com',
        password: 'hashed-password',
        role: 'user',
        isBlocked: false,
        createdAt,
        updatedAt: null,
      });
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
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findPublicProfile(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException for a non-numeric id instead of querying with NaN', async () => {
      await expect(service.findPublicProfile(NaN)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('userExists', () => {
    it('returns true when a user with that id exists', async () => {
      userRepository.findOne.mockResolvedValue({ userId: 1 });

      const result = await service.userExists(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1 },
        select: { userId: true },
      });
      expect(result).toBe(true);
    });

    it('returns false when no user with that id exists', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.userExists(999);

      expect(result).toBe(false);
    });

    it('returns false for a non-numeric id without querying the database', async () => {
      const result = await service.userExists(NaN);

      expect(result).toBe(false);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('updates username and email when neither is taken by another user', async () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');
      const existingUser = {
        userId: 1,
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        role: 'user',
        isBlocked: false,
        createdAt,
        updatedAt: null,
      };
      userRepository.findOne.mockImplementation((query: FindOneQuery) => {
        if (query.where.userId === 1) return Promise.resolve(existingUser);
        // No other user has this username or email
        return Promise.resolve(null);
      });
      userRepository.save.mockResolvedValue({
        ...existingUser,
        username: 'alice2',
        email: 'alice2@example.com',
      });
      followsService.getFollowerCount.mockResolvedValue(1);
      followsService.getFollowingCount.mockResolvedValue(2);

      const result = await service.updateProfile(1, {
        username: 'alice2',
        email: 'alice2@example.com',
      });

      expect(result).toEqual({
        userId: 1,
        username: 'alice2',
        email: 'alice2@example.com',
        role: 'user',
        createdAt,
        followerCount: 1,
        followingCount: 2,
      });
    });

    it('updates only the provided field, leaving the other unchanged', async () => {
      const existingUser = {
        userId: 1,
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        role: 'user',
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: null,
      };
      userRepository.findOne.mockImplementation((query: FindOneQuery) => {
        if (query.where.userId === 1) return Promise.resolve(existingUser);
        return Promise.resolve(null);
      });
      userRepository.save.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updateProfile(1, { username: 'alice2' });

      expect(result.username).toBe('alice2');
      expect(result.email).toBe('alice@example.com');
      // Only the username field was provided, so only a username
      // conflict-check should have run, no email check.
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'alice2' },
      });
      expect(userRepository.findOne).not.toHaveBeenCalledWith({
        where: { email: expect.anything() as string },
      });
    });

    it('throws NotFoundException when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile(999, { username: 'ghost' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the username already belongs to a different user, without calling save', async () => {
      userRepository.findOne.mockImplementation((query: FindOneQuery) => {
        if (query.where.userId === 1) {
          return Promise.resolve({
            userId: 1,
            username: 'alice',
            email: 'alice@example.com',
          });
        }
        if (query.where.username === 'bob') {
          // 'bob' belongs to a DIFFERENT user (userId 2)
          return Promise.resolve({
            userId: 2,
            username: 'bob',
            email: 'bob@example.com',
          });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.updateProfile(1, { username: 'bob' }),
      ).rejects.toThrow(ConflictException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the email already belongs to a different user, without calling save', async () => {
      userRepository.findOne.mockImplementation((query: FindOneQuery) => {
        if (query.where.userId === 1) {
          return Promise.resolve({
            userId: 1,
            username: 'alice',
            email: 'alice@example.com',
          });
        }
        if (query.where.email === 'bob@example.com') {
          return Promise.resolve({
            userId: 2,
            username: 'bob',
            email: 'bob@example.com',
          });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.updateProfile(1, { email: 'bob@example.com' }),
      ).rejects.toThrow(ConflictException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('does not throw when the "conflicting" username/email actually belongs to the same user (no-op update)', async () => {
      const existingUser = {
        userId: 1,
        username: 'alice',
        email: 'alice@example.com',
        createdAt: new Date(),
      };
      userRepository.findOne.mockImplementation((query: FindOneQuery) => {
        if (query.where.userId === 1) return Promise.resolve(existingUser);
        if (query.where.username === 'alice')
          return Promise.resolve(existingUser);
        return Promise.resolve(null);
      });
      userRepository.save.mockImplementation((u) => Promise.resolve(u));

      await expect(
        service.updateProfile(1, { username: 'alice' }),
      ).resolves.toBeDefined();
    });

    it('falls back to a generic 409 on a race-condition duplicate, even with an autogenerated index name that mentions neither username nor email', async () => {
      // This is the exact real-world shape reported: TypeORM's
      // autogenerated unique-index name is an opaque hash, not
      // "username"/"email" — the fallback must not depend on parsing it.
      userRepository.findOne.mockImplementation((query: FindOneQuery) => {
        if (query.where.userId === 1) {
          return Promise.resolve({
            userId: 1,
            username: 'alice',
            email: 'alice@example.com',
          });
        }
        // Proactive checks find no conflict...
        return Promise.resolve(null);
      });
      userRepository.save.mockRejectedValue({
        code: 'ER_DUP_ENTRY',
        errno: 1062,
        sqlState: '23000',
        message:
          "Duplicate entry 'noposts1' for key 'users.IDX_ffc81a3b97dcbf8e328d5106c0'",
      });

      await expect(
        service.updateProfile(1, { username: 'noposts1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('falls back to a generic 409 on a race-condition duplicate identified by errno alone (no code field)', async () => {
      userRepository.findOne.mockImplementation((query: FindOneQuery) => {
        if (query.where.userId === 1) {
          return Promise.resolve({
            userId: 1,
            username: 'alice',
            email: 'alice@example.com',
          });
        }
        return Promise.resolve(null);
      });
      userRepository.save.mockRejectedValue({
        errno: 1062,
        message: "Duplicate entry 'x' for key 'users.IDX_somehash'",
      });

      await expect(service.updateProfile(1, { username: 'x' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('rethrows a non-duplicate error from save() unchanged', async () => {
      userRepository.findOne.mockImplementation((query: FindOneQuery) => {
        if (query.where.userId === 1) {
          return Promise.resolve({
            userId: 1,
            username: 'alice',
            email: 'alice@example.com',
          });
        }
        return Promise.resolve(null);
      });
      const unrelatedError = new Error('connection lost');
      userRepository.save.mockRejectedValue(unrelatedError);

      await expect(
        service.updateProfile(1, { username: 'alice2' }),
      ).rejects.toThrow('connection lost');
    });
  });
});
