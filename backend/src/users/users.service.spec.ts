import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { FollowsService } from '../follows/follows.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: { findOne: jest.Mock };
  let followsService: {
    getFollowerCount: jest.Mock;
    getFollowingCount: jest.Mock;
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
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
});
