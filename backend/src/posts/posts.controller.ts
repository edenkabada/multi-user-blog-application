import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

interface AuthenticatedRequest {
  user: { userId: number; username: string };
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // Handle post creation requests from authenticated users
  @UseGuards(JwtAuthGuard)
  @Post()
  createPost(
    @Body() createPostDto: CreatePostDto,
    @Request() req: AuthenticatedRequest,
  ) {
    // Pass the post data and authenticated user to the service
    return this.postsService.create(createPostDto, req.user);
  }

  // Handle requests to retrieve all posts
  @Get()
  findAllPosts() {
    return this.postsService.findAll();
  }

  // Handle requests to retrieve a specific post
  @Get(':postId')
  findOnePost(@Param('postId') postId: string) {
    return this.postsService.findOne(Number(postId));
  }

  // Handle post update requests from authenticated users
  @UseGuards(JwtAuthGuard)
  @Put(':postId')
  updatePost(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.postsService.update(Number(postId), updatePostDto, req.user);
  }

  // Handle post deletion requests from authenticated users
  @UseGuards(JwtAuthGuard)
  @Delete(':postId')
  deletePost(
    @Param('postId') postId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.postsService.remove(Number(postId), req.user);
  }
}
