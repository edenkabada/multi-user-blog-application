import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

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
