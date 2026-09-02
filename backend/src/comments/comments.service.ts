import { Injectable } from '@nestjs/common';
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
}
