import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: jest.Mocked<Repository<Comment>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    repository = module.get(getRepositoryToken(Comment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUser', () => {
    it('queries comments filtered by userId, ordered newest first', async () => {
      repository.find.mockResolvedValue([]);

      await service.findByUser(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
      });
    });

    it("returns only that user's comments, mapped to the expected shape", async () => {
      const createdAt = new Date('2026-02-01T00:00:00Z');
      repository.find.mockResolvedValue([
        {
          commentId: 5,
          userId: 1,
          postId: 10,
          content: 'Nice post!',
          createdAt,
        } as Comment,
      ]);

      const result = await service.findByUser(1);

      expect(result).toEqual([
        {
          commentId: 5,
          userId: 1,
          postId: 10,
          content: 'Nice post!',
          createdAt,
        },
      ]);
    });

    it('returns an empty array when the user has no comments', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findByUser(1);

      expect(result).toEqual([]);
    });
  });

  describe('findAllForAdmin', () => {
    it('returns every comment with its author and post context', async () => {
      repository.find.mockResolvedValue([
        {
          commentId: 1,
          content: 'Nice post!',
          createdAt: new Date('2026-01-01'),
          userId: 1,
          user: { username: 'alon' },
          postId: 2,
          post: { title: 'Hello world' },
        } as unknown as Comment,
      ]);

      const result = await service.findAllForAdmin();

      expect(result).toEqual([
        {
          commentId: 1,
          content: 'Nice post!',
          createdAt: new Date('2026-01-01'),
          userId: 1,
          username: 'alon',
          postId: 2,
          postTitle: 'Hello world',
        },
      ]);
    });
  });

  describe('adminRemove', () => {
    it('removes the comment regardless of who wrote it', async () => {
      const existingComment = { commentId: 1 } as Comment;
      repository.findOne.mockResolvedValue(existingComment);

      const result = await service.adminRemove(1);

      expect(repository.remove).toHaveBeenCalledWith(existingComment);
      expect(result).toEqual({ message: 'Comment deleted successfully' });
    });

    it('throws NotFoundException when the comment does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.adminRemove(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
