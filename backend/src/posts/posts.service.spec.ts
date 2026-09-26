import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { CreatePostDto } from './dto/create-post.dto';

describe('PostsService', () => {
  let service: PostsService;
  let repository: jest.Mocked<Repository<Post>>;
  let likeRepository: jest.Mocked<Repository<PostLike>>;

  const user = { userId: 1, username: 'alon' };
  const otherUser = { userId: 2, username: 'someone-else' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PostLike),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            exists: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repository = module.get(getRepositoryToken(Post));
    likeRepository = module.get(getRepositoryToken(PostLike));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('associates the new post with the authenticated user', async () => {
      const dto: CreatePostDto = { title: 'Hello', content: 'World' };
      const createdPost = { ...dto, userId: user.userId } as Post;
      repository.create.mockReturnValue(createdPost);
      repository.save.mockResolvedValue({ ...createdPost, postId: 1 });

      const result = await service.create(dto, user);

      expect(repository.create).toHaveBeenCalledWith({
        userId: user.userId,
        title: dto.title,
        content: dto.content,
      });
      expect(result).toEqual({ ...createdPost, postId: 1 });
    });
  });

  describe('findAll', () => {
    it('returns every post with its author, like count, and likedByCurrentUser false for an anonymous request', async () => {
      repository.find.mockResolvedValue([
        {
          postId: 1,
          title: 'Hello',
          content: 'World',
          userId: user.userId,
          user: { username: user.username },
          createdAt: new Date('2026-01-01'),
          updatedAt: null,
        } as unknown as Post,
      ]);
      likeRepository.count.mockResolvedValue(3);

      const result = await service.findAll(null);

      expect(result).toEqual([
        expect.objectContaining({
          postId: 1,
          username: user.username,
          likesCount: 3,
          likedByCurrentUser: false,
        }),
      ]);
      // Anonymous requests have no userId to check a like against, so the
      // per-user existence query should never run.
      expect(likeRepository.exists).not.toHaveBeenCalled();
    });

    it('includes likedByCurrentUser when the requesting user has liked the post', async () => {
      repository.find.mockResolvedValue([
        {
          postId: 1,
          title: 'Hello',
          content: 'World',
          userId: user.userId,
          user: { username: user.username },
          createdAt: new Date('2026-01-01'),
          updatedAt: null,
        } as unknown as Post,
      ]);
      likeRepository.count.mockResolvedValue(3);
      likeRepository.exists.mockResolvedValue(true);

      const result = await service.findAll(user.userId);

      expect(likeRepository.exists).toHaveBeenCalledWith({
        where: { postId: 1, userId: user.userId },
      });
      expect(result[0]).toMatchObject({ likedByCurrentUser: true });
    });

    it('returns an empty array when there are no posts', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll(null);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the post with the author username, like count, and likedByCurrentUser', async () => {
      repository.findOne.mockResolvedValue({
        postId: 1,
        title: 'Hello',
        content: 'World',
        userId: user.userId,
        user: { username: user.username },
        createdAt: new Date('2026-01-01'),
        updatedAt: null,
      } as unknown as Post);
      likeRepository.count.mockResolvedValue(2);
      likeRepository.exists.mockResolvedValue(true);

      const result = await service.findOne(1, user.userId);

      expect(likeRepository.count).toHaveBeenCalledWith({
        where: { postId: 1 },
      });
      expect(likeRepository.exists).toHaveBeenCalledWith({
        where: { postId: 1, userId: user.userId },
      });
      expect(result).toMatchObject({
        postId: 1,
        username: user.username,
        likesCount: 2,
        likedByCurrentUser: true,
      });
    });

    it('does not query for a like when the request is anonymous', async () => {
      repository.findOne.mockResolvedValue({
        postId: 1,
        title: 'Hello',
        content: 'World',
        userId: user.userId,
        user: { username: user.username },
        createdAt: new Date('2026-01-01'),
        updatedAt: null,
      } as unknown as Post);
      likeRepository.count.mockResolvedValue(0);

      const result = await service.findOne(1, null);

      expect(likeRepository.exists).not.toHaveBeenCalled();
      expect(result).toMatchObject({ likedByCurrentUser: false });
    });

    it('throws NotFoundException when the post does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, null)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates the post when the requester owns it', async () => {
      const existingPost = {
        postId: 1,
        userId: user.userId,
        title: 'Old title',
        content: 'Old content',
      } as Post;
      repository.findOne.mockResolvedValue(existingPost);
      repository.save.mockResolvedValue(existingPost);

      await service.update(1, { title: 'New title' }, user);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New title', content: 'Old content' }),
      );
    });

    it('throws ForbiddenException when the requester does not own the post', async () => {
      repository.findOne.mockResolvedValue({
        postId: 1,
        userId: user.userId,
        title: 'Old title',
        content: 'Old content',
      } as Post);

      await expect(
        service.update(1, { title: 'New title' }, otherUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the post does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { title: 'New title' }, user),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findByUser', () => {
    it('queries posts filtered by userId, ordered newest first', async () => {
      repository.find.mockResolvedValue([]);

      await service.findByUser(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: { createdAt: 'DESC' },
      });
    });

    it("returns only that user's posts, mapped to the expected shape", async () => {
      const createdAt = new Date('2026-02-01T00:00:00Z');
      const updatedAt = new Date('2026-02-02T00:00:00Z');
      repository.find.mockResolvedValue([
        {
          postId: 10,
          userId: 1,
          title: 'Newest post',
          content: 'Content A',
          createdAt,
          updatedAt,
        } as Post,
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
      repository.find.mockResolvedValue([]);

      const result = await service.findByUser(1);

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('removes the post when the requester owns it', async () => {
      const existingPost = { postId: 1, userId: user.userId } as Post;
      repository.findOne.mockResolvedValue(existingPost);

      const result = await service.remove(1, user);

      expect(repository.remove).toHaveBeenCalledWith(existingPost);
      expect(result).toEqual({ message: 'Post deleted successfully' });
    });

    it('throws ForbiddenException when the requester does not own the post', async () => {
      repository.findOne.mockResolvedValue({
        postId: 1,
        userId: user.userId,
      } as Post);

      await expect(service.remove(1, otherUser)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('adminRemove', () => {
    it('removes the post regardless of who owns it', async () => {
      const existingPost = { postId: 1, userId: otherUser.userId } as Post;
      repository.findOne.mockResolvedValue(existingPost);

      const result = await service.adminRemove(1);

      expect(repository.remove).toHaveBeenCalledWith(existingPost);
      expect(result).toEqual({ message: 'Post deleted successfully' });
    });

    it('throws NotFoundException when the post does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.adminRemove(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('likePost', () => {
    it('creates and saves a like for the given post and user', async () => {
      const like = { likeId: 1, postId: 1, userId: user.userId } as PostLike;
      likeRepository.create.mockReturnValue(like);
      likeRepository.save.mockResolvedValue(like);

      const result = await service.likePost(1, user.userId);

      expect(likeRepository.create).toHaveBeenCalledWith({
        postId: 1,
        userId: user.userId,
      });
      expect(likeRepository.save).toHaveBeenCalledWith(like);
      expect(result).toBe(like);
    });
  });

  describe('unlikePost', () => {
    it("deletes the authenticated user's like for the given post", async () => {
      await service.unlikePost(1, user.userId);

      expect(likeRepository.delete).toHaveBeenCalledWith({
        postId: 1,
        userId: user.userId,
      });
    });
  });
});
