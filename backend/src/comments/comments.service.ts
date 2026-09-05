import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  // Creates and saves a new comment for the authenticated user and post
  async create(
    createCommentDto: CreateCommentDto,
    postId: number,
    user: { userId: number },
  ) {
    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      postId,
      userId: user.userId,
    });

    return this.commentRepository.save(comment);
  }

  // Retrieves comments for a specific post with the username of each commenter
  async findByPost(postId: number) {
    const comments = await this.commentRepository.find({
      where: { postId },
      relations: {
        user: true,
      },
      order: { createdAt: 'DESC' },
    });

    return comments.map((comment) => ({
      commentId: comment.commentId,
      content: comment.content,
      createdAt: comment.createdAt,
      username: comment.user.username,
    }));
  }

  // Retrieve all comments belonging to a specific user, newest first.
  // Read-only: does not verify the user exists — callers (e.g.
  // UsersController) are expected to check that first and return 404.
  async findByUser(userId: number) {
    const comments = await this.commentRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });

    return comments.map((comment) => ({
      commentId: comment.commentId,
      userId: comment.userId,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt,
    }));
  }

  // List every comment for the admin dashboard, with author and post context
  async findAllForAdmin() {
    const comments = await this.commentRepository.find({
      relations: { user: true, post: true },
      order: { createdAt: 'DESC' },
    });

    return comments.map((comment) => ({
      commentId: comment.commentId,
      content: comment.content,
      createdAt: comment.createdAt,
      userId: comment.userId,
      username: comment.user.username,
      postId: comment.postId,
      postTitle: comment.post.title,
    }));
  }

  // Delete any comment, regardless of who wrote it -- for admin moderation only.
  // Callers are responsible for ensuring the requester is actually an admin.
  async adminRemove(commentId: number) {
    const comment = await this.commentRepository.findOne({
      where: { commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.commentRepository.remove(comment);

    return {
      message: 'Comment deleted successfully',
    };
  }
}
