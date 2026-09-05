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
