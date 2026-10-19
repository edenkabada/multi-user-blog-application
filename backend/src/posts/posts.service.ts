import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { Comment } from '../comments/entities/comment.entity';
import { CommentLike } from '../comments/entities/comment-like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,

    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,

    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
  ) { }

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

  // Retrieve all posts with their authors, plus each post's like count and
  // whether the requesting user (if any) has liked it. userId is null for
  // anonymous requests.
  async findAll(userId: number | null) {
  const posts = await this.postRepository.find({
    relations: {
      user: true,
    },
    order: {
      createdAt: 'DESC',
    },
  });

  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.postId);

  const likes = await this.postLikeRepository
    .createQueryBuilder('like')
    .select('like.postId', 'postId')
    .addSelect('COUNT(*)', 'count')
    .where('like.postId IN (:...postIds)', { postIds })
    .groupBy('like.postId')
    .getRawMany();

  const comments = await this.commentRepository
    .createQueryBuilder('comment')
    .select('comment.postId', 'postId')
    .addSelect('COUNT(*)', 'count')
    .where('comment.postId IN (:...postIds)', { postIds })
    .groupBy('comment.postId')
    .getRawMany();

  let userLikes: { postId: number }[] = [];

  if (userId !== null) {
    userLikes = await this.postLikeRepository
      .createQueryBuilder('like')
      .select('like.postId', 'postId')
      .where('like.userId = :userId', { userId })
      .andWhere('like.postId IN (:...postIds)', { postIds })
      .getRawMany();
  }

  const likesCountByPost = new Map(
    likes.map((like) => [Number(like.postId), Number(like.count)]),
  );

  const commentsCountByPost = new Map(
    comments.map((comment) => [
      Number(comment.postId),
      Number(comment.count),
    ]),
  );

  const likedPostIds = new Set(
    userLikes.map((like) => Number(like.postId)),
  );

  return posts.map((post) => ({
    postId: post.postId,
    title: post.title,
    content: post.content,
    createdAt: post.createdAt,
    username: post.user.username,
    userId: post.userId,
    updatedAt: post.updatedAt,
    likesCount: likesCountByPost.get(post.postId) ?? 0,
    likedByCurrentUser: likedPostIds.has(post.postId),
    commentsCount: commentsCountByPost.get(post.postId) ?? 0,
  }));
}

  // Retrieve a specific post by its ID, plus its like count and whether the
  // requesting user (if any) has liked it. userId is null for anonymous
  // requests.
  async findOne(postId: number, userId: number | null) {
    const post = await this.postRepository.findOne({
      where: { postId },
      relations: {
        user: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const likesCount = await this.postLikeRepository.count({
      where: { postId: post.postId },
    });

    const likedByCurrentUser =
      userId !== null &&
      (await this.postLikeRepository.exists({
        where: {
          postId: post.postId,
          userId,
        },
      }));

    return {
      postId: post.postId,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      username: post.user.username,
      userId: post.userId,
      updatedAt: post.updatedAt,
      likesCount,
      likedByCurrentUser,
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
    const post = await this.findPostOrThrow(postId);

    if (post.userId !== user.userId) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }

    await this.postLikeRepository.delete({
      postId,
    });

    const comments = await this.commentRepository.find({
      where: { postId },
    });

    for (const comment of comments) {
      await this.commentLikeRepository.delete({
        commentId: comment.commentId,
      });
    }

    await this.commentRepository.delete({
      postId,
    });

    await this.postRepository.remove(post);

    return {
      message: 'Post deleted successfully',
    };
  }

  // Delete any post, regardless of ownership -- for admin moderation only.
  // Callers are responsible for ensuring the requester is actually an admin.
  async adminRemove(postId: number) {
    const post = await this.findPostOrThrow(postId);

    await this.postLikeRepository.delete({
      postId,
    });

    const comments = await this.commentRepository.find({
      where: { postId },
    });
    for (const comment of comments) {
      await this.commentLikeRepository.delete({
        commentId: comment.commentId,
      });
    }

    await this.commentRepository.delete({
      postId,
    });

    await this.postRepository.remove(post);

    return {
      message: 'Post deleted successfully',
    };
  }

  // Adds a like to a post for the authenticated user
  async likePost(postId: number, userId: number) {
    const like = this.postLikeRepository.create({
      postId,
      userId,
    });

    return this.postLikeRepository.save(like);
  }

  // Removes the authenticated user's like from a post
  async unlikePost(postId: number, userId: number) {
    await this.postLikeRepository.delete({
      postId,
      userId,
    });
  }

  private async findPostOrThrow(postId: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }
}
