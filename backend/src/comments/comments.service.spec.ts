import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepository: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    commentRepository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: commentRepository,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUser', () => {
    it('queries comments filtered by userId, ordered newest first', async () => {
      commentRepository.find.mockResolvedValue([]);

      await service.findByUser(1);

      expect(commentRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
      });
    });

    it("returns only that user's comments, mapped to the expected shape", async () => {
      const createdAt = new Date('2026-02-01T00:00:00Z');
      commentRepository.find.mockResolvedValue([
        {
          commentId: 5,
          userId: 1,
          postId: 10,
          content: 'Nice post!',
          createdAt,
        },
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
      commentRepository.find.mockResolvedValue([]);

      const result = await service.findByUser(1);

      expect(result).toEqual([]);
    });
  });
});
