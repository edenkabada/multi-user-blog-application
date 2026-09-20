import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';
import { FollowsService } from '../follows/follows.service';

interface AuthenticatedRequest {
  user: { userId: number; username: string };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly followsService: FollowsService,
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

  // Update the authenticated user's own profile (username/email).
  // Scoped to req.user.userId only — there is no :id in this route, so a
  // user can never edit anyone else's profile through this endpoint.
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Patch('me')
  updateMe(
    @Body() updateProfileDto: UpdateProfileDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateProfileDto);
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

  // Return a merged, chronological feed of a user's posts and comments.
  // Reuses PostsService.findByUser (SCRUM-39) and CommentsService.findByUser
  // (SCRUM-40) as-is — this endpoint only tags and merges their results.
  @Get(':id/activity')
  async getUserActivity(@Param('id') id: string) {
    const userId = Number(id);
    const exists = await this.usersService.userExists(userId);

    if (!exists) {
      throw new NotFoundException('User not found');
    }

    const [posts, comments] = await Promise.all([
      this.postsService.findByUser(userId),
      this.commentsService.findByUser(userId),
    ]);

    const activity = [
      ...posts.map((post) => ({ type: 'post' as const, ...post })),
      ...comments.map((comment) => ({ type: 'comment' as const, ...comment })),
    ];

    activity.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return activity;
  }

  // Follow another user. Self-follow and duplicate-follow rejection are
  // handled by FollowsService; this only guards that the target user
  // actually exists, consistent with the other :id-scoped endpoints.
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async followUser(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const followingId = Number(id);
    const exists = await this.usersService.userExists(followingId);

    if (!exists) {
      throw new NotFoundException('User not found');
    }

    return this.followsService.follow(req.user.userId, followingId);
  }

  // Unfollow another user. No existence check here — unfollowing should
  // always succeed as a way to clear a stale relationship, even if the
  // target user account no longer exists.
  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  unfollowUser(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.followsService.unfollow(req.user.userId, Number(id));
  }

  // Report whether the authenticated user already follows :id. Needed so
  // the frontend can show the correct Follow/Unfollow button state —
  // nothing else exposes this.
  @UseGuards(JwtAuthGuard)
  @Get(':id/follow-status')
  async getFollowStatus(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const isFollowing = await this.followsService.isFollowing(
      req.user.userId,
      Number(id),
    );

    return { isFollowing };
  }
}
