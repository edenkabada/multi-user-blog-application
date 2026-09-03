import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

describe('PostsController', () => {
  let controller: PostsController;
  let service: jest.Mocked<PostsService>;

  const req = { user: { userId: 1, username: 'alon' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
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

  it('createPost delegates to PostsService with the authenticated user', async () => {
    const dto: CreatePostDto = { title: 'Hello', content: 'World' };
    const expected = { postId: 1, ...dto };
    service.create.mockResolvedValue(expected as never);

    const result = await controller.createPost(dto, req);

    expect(service.create).toHaveBeenCalledWith(dto, req.user);
    expect(result).toBe(expected);
  });

  it('findAllPosts delegates to PostsService', async () => {
    const expected = [{ postId: 1, title: 'Hello' }];
    service.findAll.mockResolvedValue(expected as never);

    const result = await controller.findAllPosts();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toBe(expected);
  });

  it('findOnePost converts the postId param to a number', async () => {
    const expected = { postId: 1, title: 'Hello' };
    service.findOne.mockResolvedValue(expected as never);

    const result = await controller.findOnePost('1');

    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toBe(expected);
  });

  it('updatePost delegates to PostsService with the authenticated user', async () => {
    const dto = { title: 'Updated' };
    const expected = { postId: 1, title: 'Updated' };
    service.update.mockResolvedValue(expected as never);

    const result = await controller.updatePost('1', dto, req);

    expect(service.update).toHaveBeenCalledWith(1, dto, req.user);
    expect(result).toBe(expected);
  });

  it('deletePost delegates to PostsService with the authenticated user', async () => {
    const expected = { message: 'Post deleted successfully' };
    service.remove.mockResolvedValue(expected);

    const result = await controller.deletePost('1', req);

    expect(service.remove).toHaveBeenCalledWith(1, req.user);
    expect(result).toBe(expected);
  });
});
