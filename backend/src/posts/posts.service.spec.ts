import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';

describe('PostsService', () => {
  let service: PostsService;
  let postRepository: { find: jest.Mock };

  beforeEach(async () => {
    postRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: postRepository,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUser', () => {
    it('queries posts filtered by userId, ordered newest first', async () => {
      postRepository.find.mockResolvedValue([]);

      await service.findByUser(1);

      expect(postRepository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
      });
    });

    it("returns only that user's posts, mapped to the expected shape", async () => {
      const createdAt = new Date('2026-02-01T00:00:00Z');
      const updatedAt = new Date('2026-02-02T00:00:00Z');
      postRepository.find.mockResolvedValue([
        {
          postId: 10,
          userId: 1,
          title: 'Newest post',
          content: 'Content A',
          createdAt,
          updatedAt,
        },
      ]);

      const result = await service.findByUser(1);

      expect(result).toEqual([
        {
          postId: 10,
          title: 'Newest post',
          content: 'Content A',
          createdAt,
          userId: 1,
          updatedAt,
        },
      ]);
    });

    it('returns an empty array when the user has no posts', async () => {
      postRepository.find.mockResolvedValue([]);

      const result = await service.findByUser(1);

      expect(result).toEqual([]);
    });
  });
});
