import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';


@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,

        @InjectRepository(CommentLike)
        private readonly likeRepository: Repository<CommentLike>,
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

    // Adds a like to a comment for the authenticated user
    async likeComment(
        commentId: number,
        userId: number,
    ) {
        const like = this.likeRepository.create({
            commentId,
            userId,
        });

        return this.likeRepository.save(like);
    }

    // Removes the authenticated user's like from a comment
    async unlikeComment(
        commentId: number,
        userId: number,
    ) {
        await this.likeRepository.delete({
            commentId,
            userId,
        });
    }

    // Retrieves comments for a specific post with the username of each commenter
    async findByPost(postId: number, userId: number | null) {
        const comments = await this.commentRepository.find({
            where: { postId },
            relations: {
                user: true,
            },
            order: { createdAt: 'DESC' },
        });

        return Promise.all(
            comments.map(async (comment) => {
                const likesCount = await this.likeRepository.count({
                    where: { commentId: comment.commentId },
                });

                return {
                    commentId: comment.commentId,
                    content: comment.content,
                    createdAt: comment.createdAt,
                    username: comment.user.username,
                    likesCount,
                    likedByCurrentUser:
                        userId !== null &&
                        await this.likeRepository.exists({
                            where: {
                                commentId: comment.commentId,
                                userId,
                            },
                        }),
                };
            }),
        );
    }
}
