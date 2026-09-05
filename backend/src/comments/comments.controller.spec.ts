import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: jest.Mocked<CommentsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: {
            create: jest.fn(),
            findByPost: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get(CommentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createComment delegates to CommentsService with the postId, DTO, and authenticated user', async () => {
    const dto: CreateCommentDto = { content: 'Nice post!' };
    const req = { user: { userId: 1, username: 'alon' } };
    const expected = { commentId: 1, content: dto.content, postId: 2 };
    service.create.mockResolvedValue(expected as never);

    const result = await controller.createComment('2', dto, req);

    expect(service.create).toHaveBeenCalledWith(dto, 2, req.user);
    expect(result).toBe(expected);
  });

  it('findCommentsByPost delegates to CommentsService with the numeric postId', async () => {
    const expected = [
      { commentId: 1, content: 'Nice post!', username: 'alon' },
    ];
    service.findByPost.mockResolvedValue(expected as never);

    const result = await controller.findCommentsByPost('2');

    expect(service.findByPost).toHaveBeenCalledWith(2);
    expect(result).toBe(expected);
  });
});
