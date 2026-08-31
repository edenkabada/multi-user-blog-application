import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';
import { FollowsService } from '../follows/follows.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findMe: jest.Mock;
    findPublicProfile: jest.Mock;
    userExists: jest.Mock;
  };
  let postsService: { findByUser: jest.Mock };
  let commentsService: { findByUser: jest.Mock };
  let followsService: { follow: jest.Mock; unfollow: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findMe: jest.fn(),
      findPublicProfile: jest.fn(),
      userExists: jest.fn(),
    };
    postsService = {
      findByUser: jest.fn(),
    };
    commentsService = {
      findByUser: jest.fn(),
    };
    followsService = {
      follow: jest.fn(),
      unfollow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: PostsService,
          useValue: postsService,
        },
        {
          provide: CommentsService,
          useValue: commentsService,
        },
        {
          provide: FollowsService,
          useValue: followsService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('calls usersService.findMe with the authenticated user id from the request', async () => {
      const expectedProfile = {
        userId: 1,
        username: 'alice',
        email: 'alice@example.com',
        role: 'user',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      usersService.findMe.mockResolvedValue(expectedProfile);

      const req = { user: { userId: 1, username: 'alice' } };
      const result = await controller.getMe(req);

      expect(usersService.findMe).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedProfile);
    });
  });

  describe('getUserById', () => {
    it('calls usersService.findPublicProfile with the numeric id from the route param', async () => {
      const expectedProfile = {
        userId: 2,
        username: 'bob',
        role: 'user',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      usersService.findPublicProfile.mockResolvedValue(expectedProfile);

      const result = await controller.getUserById('2');

      expect(usersService.findPublicProfile).toHaveBeenCalledWith(2);
      expect(result).toEqual(expectedProfile);
    });
  });

  describe('getUserPosts', () => {
    it("returns the user's posts when the user exists", async () => {
      usersService.userExists.mockResolvedValue(true);
      const expectedPosts = [
        {
          postId: 1,
          title: 'A',
          content: 'B',
          createdAt: new Date(),
          userId: 2,
          updatedAt: null,
        },
      ];
      postsService.findByUser.mockResolvedValue(expectedPosts);

      const result = await controller.getUserPosts('2');

      expect(usersService.userExists).toHaveBeenCalledWith(2);
      expect(postsService.findByUser).toHaveBeenCalledWith(2);
      expect(result).toEqual(expectedPosts);
    });

    it('returns an empty array when the user exists but has no posts', async () => {
      usersService.userExists.mockResolvedValue(true);
      postsService.findByUser.mockResolvedValue([]);

      const result = await controller.getUserPosts('2');

      expect(result).toEqual([]);
    });

    it('throws NotFoundException and never calls postsService when the user does not exist', async () => {
      usersService.userExists.mockResolvedValue(false);

      await expect(controller.getUserPosts('999')).rejects.toThrow(
        NotFoundException,
      );
      expect(postsService.findByUser).not.toHaveBeenCalled();
    });
  });

  describe('getUserComments', () => {
    it("returns the user's comments when the user exists", async () => {
      usersService.userExists.mockResolvedValue(true);
      const expectedComments = [
        {
          commentId: 1,
          userId: 2,
          postId: 5,
          content: 'Great post',
          createdAt: new Date(),
        },
      ];
      commentsService.findByUser.mockResolvedValue(expectedComments);

      const result = await controller.getUserComments('2');

      expect(usersService.userExists).toHaveBeenCalledWith(2);
      expect(commentsService.findByUser).toHaveBeenCalledWith(2);
      expect(result).toEqual(expectedComments);
    });

    it('returns an empty array when the user exists but has no comments', async () => {
      usersService.userExists.mockResolvedValue(true);
      commentsService.findByUser.mockResolvedValue([]);

      const result = await controller.getUserComments('2');

      expect(result).toEqual([]);
    });

    it('throws NotFoundException and never calls commentsService when the user does not exist', async () => {
      usersService.userExists.mockResolvedValue(false);

      await expect(controller.getUserComments('999')).rejects.toThrow(
        NotFoundException,
      );
      expect(commentsService.findByUser).not.toHaveBeenCalled();
    });
  });

  describe('getUserActivity', () => {
    it('merges posts and comments into one feed, tagged by type, sorted newest first', async () => {
      usersService.userExists.mockResolvedValue(true);
      postsService.findByUser.mockResolvedValue([
        {
          postId: 1,
          title: 'Oldest post',
          content: 'A',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          userId: 2,
          updatedAt: null,
        },
      ]);
      commentsService.findByUser.mockResolvedValue([
        {
          commentId: 1,
          userId: 2,
          postId: 5,
          content: 'Newest comment',
          createdAt: new Date('2026-03-01T00:00:00Z'),
        },
      ]);

      const result = await controller.getUserActivity('2');

      expect(usersService.userExists).toHaveBeenCalledWith(2);
      expect(postsService.findByUser).toHaveBeenCalledWith(2);
      expect(commentsService.findByUser).toHaveBeenCalledWith(2);
      expect(result).toHaveLength(2);
      // Newest first: the comment (March) should come before the post (January)
      expect(result[0]).toMatchObject({ type: 'comment', commentId: 1 });
      expect(result[1]).toMatchObject({ type: 'post', postId: 1 });
    });

    it('returns an empty array when the user has no posts or comments', async () => {
      usersService.userExists.mockResolvedValue(true);
      postsService.findByUser.mockResolvedValue([]);
      commentsService.findByUser.mockResolvedValue([]);

      const result = await controller.getUserActivity('2');

      expect(result).toEqual([]);
    });

    it('throws NotFoundException and never calls postsService/commentsService when the user does not exist', async () => {
      usersService.userExists.mockResolvedValue(false);

      await expect(controller.getUserActivity('999')).rejects.toThrow(
        NotFoundException,
      );
      expect(postsService.findByUser).not.toHaveBeenCalled();
      expect(commentsService.findByUser).not.toHaveBeenCalled();
    });
  });

  describe('followUser', () => {
    it('checks the target user exists, then delegates to followsService.follow with follower/following ids', async () => {
      usersService.userExists.mockResolvedValue(true);
      followsService.follow.mockResolvedValue({
        followId: 1,
        followerId: 1,
        followingId: 2,
      });

      const req = { user: { userId: 1, username: 'alice' } };
      const result = await controller.followUser('2', req);

      expect(usersService.userExists).toHaveBeenCalledWith(2);
      expect(followsService.follow).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual({ followId: 1, followerId: 1, followingId: 2 });
    });

    it('throws NotFoundException and never calls followsService when the target user does not exist', async () => {
      usersService.userExists.mockResolvedValue(false);

      const req = { user: { userId: 1, username: 'alice' } };

      await expect(controller.followUser('999', req)).rejects.toThrow(
        NotFoundException,
      );
      expect(followsService.follow).not.toHaveBeenCalled();
    });
  });

  describe('unfollowUser', () => {
    it('delegates to followsService.unfollow with follower/following ids', async () => {
      followsService.unfollow.mockResolvedValue({
        message: 'Unfollowed successfully',
      });

      const req = { user: { userId: 1, username: 'alice' } };
      const result = await controller.unfollowUser('2', req);

      expect(followsService.unfollow).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual({ message: 'Unfollowed successfully' });
    });
  });
});
