import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  // Create a new post and associate it with the authenticated user
  async create(
    createPostDto: CreatePostDto,
    user: { userId: number; username: string },
  ) {
    const post = this.postRepository.create({
      userId: user.userId,
      title: createPostDto.title,
      content: createPostDto.content,
    });

    return this.postRepository.save(post);
  }

  // Retrieve all posts with their authors
  async findAll() {
    const posts = await this.postRepository.find({
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    // Return post details with the author's username
    return posts.map((post) => ({
      postId: post.postId,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      username: post.user.username,
      userId: post.userId,
      updatedAt: post.updatedAt,
    }));
  }

  // Retrieve a specific post by its ID
  async findOne(postId: number) {
    const post = await this.postRepository.findOne({
      where: { postId },
      relations: {
        user: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Return post details with the author's username
    return {
      postId: post.postId,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      username: post.user.username,
      userId: post.userId,
      updatedAt: post.updatedAt,
    };
  }

  // Update an existing post owned by the authenticated user
  async update(
    postId: number,
    updatePostDto: UpdatePostDto,
    user: { userId: number; username: string },
  ) {
    const post = await this.postRepository.findOne({
      where: { postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== user.userId) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    post.title = updatePostDto.title ?? post.title;
    post.content = updatePostDto.content ?? post.content;

    return this.postRepository.save(post);
  }

  // Retrieve all posts belonging to a specific user, newest first.
  // Does not verify the user exists — callers (e.g. UsersController) are
  // expected to check that first and return 404 before calling this.
  async findByUser(userId: number) {
    const posts = await this.postRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });

    return posts.map((post) => ({
      postId: post.postId,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      userId: post.userId,
      updatedAt: post.updatedAt,
    }));
  }

  // Delete an existing post owned by the authenticated user
  async remove(postId: number, user: { userId: number; username: string }) {
    const post = await this.postRepository.findOne({
      where: { postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== user.userId) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    await this.postRepository.remove(post);

    return {
      message: 'Post deleted successfully',
    };
  }
}
