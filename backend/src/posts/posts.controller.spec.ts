import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

describe('PostsController', () => {
  let controller: PostsController;
  let service: jest.Mocked<PostsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates post creation to PostsService with the DTO and authenticated user', async () => {
    const dto: CreatePostDto = { title: 'Hello', content: 'World' };
    const user = { userId: 1, username: 'alon' };
    const expected = { postId: 1, userId: user.userId, ...dto };
    service.create.mockResolvedValue(expected as never);

    const result = await controller.createPost(dto, { user });

    expect(service.create).toHaveBeenCalledWith(dto, user);
    expect(result).toBe(expected);
  });

  it('delegates listing posts to PostsService', async () => {
    const expected = [
      { postId: 2, title: 'Newer', content: 'B' },
      { postId: 1, title: 'Older', content: 'A' },
    ];
    service.findAll.mockResolvedValue(expected as never);

    const result = await controller.findAllPosts();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toBe(expected);
  });
});
