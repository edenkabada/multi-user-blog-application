import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    findMe: jest.Mock;
    findPublicProfile: jest.Mock;
    userExists: jest.Mock;
  };
  let postsService: { findByUser: jest.Mock };
  let commentsService: { findByUser: jest.Mock };

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
});
