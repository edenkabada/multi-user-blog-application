import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';

describe('PostsController', () => {
  let controller: PostsController;
  let service: jest.Mocked<PostsService>;

  const req = { user: { userId: 1, username: 'alon' } };
  const anonymousReq = { user: undefined };

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
            likePost: jest.fn(),
            unlikePost: jest.fn(),
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

  describe('findAllPosts', () => {
    it("delegates to PostsService with the authenticated user's id when a token is present", async () => {
      const expected = [{ postId: 1, title: 'Hello' }];
      service.findAll.mockResolvedValue(expected as never);

      const result = await controller.findAllPosts(req);

      expect(service.findAll).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });

    it('delegates to PostsService with null when the request is anonymous', async () => {
      const expected = [{ postId: 1, title: 'Hello' }];
      service.findAll.mockResolvedValue(expected as never);

      const result = await controller.findAllPosts(anonymousReq);

      expect(service.findAll).toHaveBeenCalledWith(null);
      expect(result).toBe(expected);
    });
  });

  describe('findOnePost', () => {
    it("converts the postId param to a number and passes the authenticated user's id", async () => {
      const expected = { postId: 1, title: 'Hello' };
      service.findOne.mockResolvedValue(expected as never);

      const result = await controller.findOnePost('1', req);

      expect(service.findOne).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(expected);
    });

    it('passes null for the requesting user when the request is anonymous', async () => {
      const expected = { postId: 1, title: 'Hello' };
      service.findOne.mockResolvedValue(expected as never);

      const result = await controller.findOnePost('1', anonymousReq);

      expect(service.findOne).toHaveBeenCalledWith(1, null);
      expect(result).toBe(expected);
    });
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

  it('likePost delegates to PostsService with the numeric postId and authenticated user id', async () => {
    const expected = { likeId: 1, postId: 1, userId: 1 };
    service.likePost.mockResolvedValue(expected as never);

    const result = await controller.likePost('1', req);

    expect(service.likePost).toHaveBeenCalledWith(1, 1);
    expect(result).toBe(expected);
  });

  it('unlikePost delegates to PostsService with the numeric postId and authenticated user id', async () => {
    service.unlikePost.mockResolvedValue(undefined);

    const result = await controller.unlikePost('1', req);

    expect(service.unlikePost).toHaveBeenCalledWith(1, 1);
    expect(result).toBeUndefined();
  });
});
