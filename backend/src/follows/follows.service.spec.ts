import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FollowsService } from './follows.service';
import { Follow } from './entities/follow.entity';

describe('FollowsService', () => {
  let service: FollowsService;
  let followRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    count: jest.Mock;
  };

  beforeEach(async () => {
    followRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowsService,
        {
          provide: getRepositoryToken(Follow),
          useValue: followRepository,
        },
      ],
    }).compile();

    service = module.get<FollowsService>(FollowsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('follow', () => {
    it('throws BadRequestException when a user tries to follow themselves', async () => {
      await expect(service.follow(1, 1)).rejects.toThrow(BadRequestException);
      expect(followRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the follow relationship already exists', async () => {
      followRepository.findOne.mockResolvedValue({
        followId: 1,
        followerId: 1,
        followingId: 2,
      });

      await expect(service.follow(1, 2)).rejects.toThrow(ConflictException);
      expect(followRepository.save).not.toHaveBeenCalled();
    });

    it('creates and saves a new follow relationship when none exists', async () => {
      followRepository.findOne.mockResolvedValue(null);
      followRepository.create.mockReturnValue({
        followerId: 1,
        followingId: 2,
      });
      followRepository.save.mockResolvedValue({
        followId: 10,
        followerId: 1,
        followingId: 2,
      });

      const result = await service.follow(1, 2);

      expect(followRepository.create).toHaveBeenCalledWith({
        followerId: 1,
        followingId: 2,
      });
      expect(followRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        followId: 10,
        followerId: 1,
        followingId: 2,
      });
    });
  });

  describe('unfollow', () => {
    it('removes the follow relationship when it exists', async () => {
      const existing = { followId: 1, followerId: 1, followingId: 2 };
      followRepository.findOne.mockResolvedValue(existing);

      const result = await service.unfollow(1, 2);

      expect(followRepository.remove).toHaveBeenCalledWith(existing);
      expect(result).toEqual({ message: 'Unfollowed successfully' });
    });

    it('is a no-op success when no follow relationship exists', async () => {
      followRepository.findOne.mockResolvedValue(null);

      const result = await service.unfollow(1, 2);

      expect(followRepository.remove).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Not following this user' });
    });
  });

  describe('getFollowerCount', () => {
    it('counts follows where this user is being followed', async () => {
      followRepository.count.mockResolvedValue(5);

      const result = await service.getFollowerCount(2);

      expect(followRepository.count).toHaveBeenCalledWith({
        where: { followingId: 2 },
      });
      expect(result).toBe(5);
    });
  });

  describe('getFollowingCount', () => {
    it('counts follows where this user is the follower', async () => {
      followRepository.count.mockResolvedValue(3);

      const result = await service.getFollowingCount(1);

      expect(followRepository.count).toHaveBeenCalledWith({
        where: { followerId: 1 },
      });
      expect(result).toBe(3);
    });
  });

  describe('isFollowing', () => {
    it('returns true when a follow relationship exists', async () => {
      followRepository.findOne.mockResolvedValue({
        followId: 1,
        followerId: 1,
        followingId: 2,
      });

      const result = await service.isFollowing(1, 2);

      expect(followRepository.findOne).toHaveBeenCalledWith({
        where: { followerId: 1, followingId: 2 },
      });
      expect(result).toBe(true);
    });

    it('returns false when no follow relationship exists', async () => {
      followRepository.findOne.mockResolvedValue(null);

      const result = await service.isFollowing(1, 2);

      expect(result).toBe(false);
    });
  });
});
