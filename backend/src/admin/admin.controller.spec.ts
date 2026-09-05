import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';

describe('AdminController', () => {
  let controller: AdminController;
  let usersService: jest.Mocked<UsersService>;
  let postsService: jest.Mocked<PostsService>;
  let commentsService: jest.Mocked<CommentsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAllForAdmin: jest.fn(),
            setBlocked: jest.fn(),
          },
        },
        {
          provide: PostsService,
          useValue: {
            findAll: jest.fn(),
            adminRemove: jest.fn(),
          },
        },
        {
          provide: CommentsService,
          useValue: {
            findAllForAdmin: jest.fn(),
            adminRemove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    usersService = module.get(UsersService);
    postsService = module.get(PostsService);
    commentsService = module.get(CommentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getUsers delegates to UsersService', async () => {
    const expected = [{ userId: 1, username: 'alon' }];
    usersService.findAllForAdmin.mockResolvedValue(expected as never);

    const result = await controller.getUsers();

    expect(usersService.findAllForAdmin).toHaveBeenCalled();
    expect(result).toBe(expected);
  });

  it('blockUser converts the userId param and blocks the user', async () => {
    const expected = { userId: 1, isBlocked: true };
    usersService.setBlocked.mockResolvedValue(expected as never);

    const result = await controller.blockUser('1');

    expect(usersService.setBlocked).toHaveBeenCalledWith(1, true);
    expect(result).toBe(expected);
  });

  it('unblockUser converts the userId param and unblocks the user', async () => {
    const expected = { userId: 1, isBlocked: false };
    usersService.setBlocked.mockResolvedValue(expected as never);

    const result = await controller.unblockUser('1');

    expect(usersService.setBlocked).toHaveBeenCalledWith(1, false);
    expect(result).toBe(expected);
  });

  it('getPosts delegates to PostsService', async () => {
    const expected = [{ postId: 1, title: 'Hello' }];
    postsService.findAll.mockResolvedValue(expected as never);

    const result = await controller.getPosts();

    expect(postsService.findAll).toHaveBeenCalled();
    expect(result).toBe(expected);
  });

  it('deletePost converts the postId param and removes the post', async () => {
    const expected = { message: 'Post deleted successfully' };
    postsService.adminRemove.mockResolvedValue(expected);

    const result = await controller.deletePost('1');

    expect(postsService.adminRemove).toHaveBeenCalledWith(1);
    expect(result).toBe(expected);
  });

  it('getComments delegates to CommentsService', async () => {
    const expected = [{ commentId: 1, content: 'Nice post!' }];
    commentsService.findAllForAdmin.mockResolvedValue(expected as never);

    const result = await controller.getComments();

    expect(commentsService.findAllForAdmin).toHaveBeenCalled();
    expect(result).toBe(expected);
  });

  it('deleteComment converts the commentId param and removes the comment', async () => {
    const expected = { message: 'Comment deleted successfully' };
    commentsService.adminRemove.mockResolvedValue(expected);

    const result = await controller.deleteComment('1');

    expect(commentsService.adminRemove).toHaveBeenCalledWith(1);
    expect(result).toBe(expected);
  });
});
