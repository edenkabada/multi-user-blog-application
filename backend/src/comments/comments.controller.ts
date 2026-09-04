import { Body, Controller, Param, Post, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
    constructor(
        private readonly commentsService: CommentsService,
    ) { }

    // Allows authenticated users to create a comment for a specific post
    @UseGuards(JwtAuthGuard)
    @Post(':postId')
    createComment(
        @Param('postId') postId: string,
        @Body() createCommentDto: CreateCommentDto,
        @Request() req,
    ) {
        return this.commentsService.create(
            createCommentDto,
            Number(postId),
            req.user,
        );
    }

    // Handle requests to retrieve comments for a specific post
    @Get(':postId')
    findCommentsByPost(
        @Param('postId') postId: string,
    ) {
        return this.commentsService.findByPost(Number(postId));
    }
}
