import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

describe('PostsService', () => {
  let service: PostsService;
  let repository: jest.Mocked<Repository<Post>>;

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
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    repository = module.get(getRepositoryToken(Post));
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

  describe('findOne', () => {
    it('returns the post with the author username', async () => {
      repository.findOne.mockResolvedValue({
        postId: 1,
        title: 'Hello',
        content: 'World',
        userId: user.userId,
        user: { username: user.username },
        createdAt: new Date('2026-01-01'),
        updatedAt: null,
      } as unknown as Post);

      const result = await service.findOne(1);

      expect(result).toMatchObject({ postId: 1, username: user.username });
    });

    it('throws NotFoundException when the post does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toBeInstanceOf(
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
});
