import { Controller, Body, Post, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
    ) { }

     // Handle post creation requests from authenticated users
    @UseGuards(JwtAuthGuard)
    @Post()
    createPost(
        @Body() createPostDto: CreatePostDto,
        @Request() req,
    ) {
        // Pass the post data and authenticated user to the service
        return this.postsService.create(createPostDto, req.user);
    }

    // Handle requests to retrieve all posts
    @Get()
    findAllPosts() {
        return this.postsService.findAll();
    }
}
