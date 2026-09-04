import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: jest.Mocked<Repository<Comment>>;

  const user = { userId: 1 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
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

  describe('create', () => {
    it('creates and saves a comment for the given post and authenticated user', async () => {
      const dto: CreateCommentDto = { content: 'Nice post!' };
      const postId = 2;
      const createdComment = {
        content: dto.content,
        postId,
        userId: user.userId,
      } as Comment;
      repository.create.mockReturnValue(createdComment);
      repository.save.mockResolvedValue({ ...createdComment, commentId: 1 });

      const result = await service.create(dto, postId, user);

      expect(repository.create).toHaveBeenCalledWith({
        content: dto.content,
        postId,
        userId: user.userId,
      });
      expect(repository.save).toHaveBeenCalledWith(createdComment);
      expect(result).toEqual({ ...createdComment, commentId: 1 });
    });
  });
});
