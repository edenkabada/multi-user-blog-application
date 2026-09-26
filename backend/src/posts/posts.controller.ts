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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

interface AuthenticatedRequest {
  user: { userId: number; username: string };
}

interface OptionalAuthenticatedRequest {
  user?: { userId: number; username: string };
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

  // Handle requests to retrieve all posts. Auth is optional here --
  // anonymous visitors can still view posts, but a logged-in user's own
  // like state is included when a valid token is sent.
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAllPosts(@Request() req: OptionalAuthenticatedRequest) {
    return this.postsService.findAll(req.user?.userId ?? null);
  }

  // Handle requests to retrieve a specific post. Same optional-auth
  // treatment as findAllPosts, for the same reason.
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':postId')
  findOnePost(
    @Param('postId') postId: string,
    @Request() req: OptionalAuthenticatedRequest,
  ) {
    return this.postsService.findOne(Number(postId), req.user?.userId ?? null);
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

  // Allows authenticated users to like a post
  @UseGuards(JwtAuthGuard)
  @Post(':postId/like')
  likePost(
    @Param('postId') postId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.postsService.likePost(Number(postId), req.user.userId);
  }

  // Allows authenticated users to unlike a post
  @UseGuards(JwtAuthGuard)
  @Post(':postId/unlike')
  unlikePost(
    @Param('postId') postId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.postsService.unlikePost(Number(postId), req.user.userId);
  }
}
