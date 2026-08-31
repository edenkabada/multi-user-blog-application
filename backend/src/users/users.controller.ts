import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';

interface AuthenticatedRequest {
  user: { userId: number; username: string };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {}

  // Handle user registration requests
  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.register(registerUserDto);
  }

  // Handle user login requests
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.usersService.login(loginUserDto);
  }

  // Return the authenticated user's own profile.
  // Must be declared before the ':id' route below, otherwise Nest would
  // match "me" as an :id value instead of routing here.
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: AuthenticatedRequest) {
    return this.usersService.findMe(req.user.userId);
  }

  // Return public profile fields for any user by id
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.findPublicProfile(Number(id));
  }

  // Return all posts belonging to a specific user, newest first.
  // 404s if the user doesn't exist; returns [] if they exist but have
  // no posts. Existence is checked here so PostsService can stay focused
  // purely on post-filtering, per SCRUM-39's scope.
  @Get(':id/posts')
  async getUserPosts(@Param('id') id: string) {
    const userId = Number(id);
    const exists = await this.usersService.userExists(userId);

    if (!exists) {
      throw new NotFoundException('User not found');
    }

    return this.postsService.findByUser(userId);
  }

  // Return all comments belonging to a specific user, newest first.
  // Same 404-guard pattern as getUserPosts: existence checked here,
  // CommentsService stays focused purely on comment-filtering.
  @Get(':id/comments')
  async getUserComments(@Param('id') id: string) {
    const userId = Number(id);
    const exists = await this.usersService.userExists(userId);

    if (!exists) {
      throw new NotFoundException('User not found');
    }

    return this.commentsService.findByUser(userId);
  }
}
