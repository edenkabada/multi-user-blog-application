import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

describe('PostsService', () => {
  let service: PostsService;
  let repository: jest.Mocked<Repository<Post>>;

  const createPostDto: CreatePostDto = {
    title: 'Hello world',
    content: 'This is my first post.',
  };
  const user = { userId: 1, username: 'alon' };

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

  it('creates a post associated with the authenticated user', async () => {
    const createdPost = { ...createPostDto, userId: user.userId } as Post;
    repository.create.mockReturnValue(createdPost);
    repository.save.mockResolvedValue({
      ...createdPost,
      postId: 1,
    });

    const result = await service.create(createPostDto, user);

    expect(repository.create).toHaveBeenCalledWith({
      userId: user.userId,
      title: createPostDto.title,
      content: createPostDto.content,
    });
    expect(repository.save).toHaveBeenCalledWith(createdPost);
    expect(result).toEqual({ ...createdPost, postId: 1 });
  });

  it('returns all posts ordered newest first', async () => {
    const posts = [
      { postId: 2, title: 'Newer' } as Post,
      { postId: 1, title: 'Older' } as Post,
    ];
    repository.find.mockResolvedValue(posts);

    const result = await service.findAll();

    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
    expect(result).toBe(posts);
  });
});
