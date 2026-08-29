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
}
