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
    ) { }

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
}
