import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UsersService } from '../users/users.service';
import { PostsService } from '../posts/posts.service';
import { CommentsService } from '../comments/comments.service';

// Every route here requires a valid JWT belonging to an admin
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {}

  // List every user for the dashboard
  @Get('users')
  getUsers() {
    return this.usersService.findAllForAdmin();
  }

  // Block a user, preventing them from logging in
  @Patch('users/:userId/block')
  blockUser(@Param('userId') userId: string) {
    return this.usersService.setBlocked(Number(userId), true);
  }

  // Unblock a previously blocked user
  @Patch('users/:userId/unblock')
  unblockUser(@Param('userId') userId: string) {
    return this.usersService.setBlocked(Number(userId), false);
  }

  // List every post for the dashboard
  @Get('posts')
  getPosts() {
    return this.postsService.findAll();
  }

  // Delete any post, regardless of who owns it
  @Delete('posts/:postId')
  deletePost(@Param('postId') postId: string) {
    return this.postsService.adminRemove(Number(postId));
  }

  // List every comment for the dashboard
  @Get('comments')
  getComments() {
    return this.commentsService.findAllForAdmin();
  }

  // Delete any comment, regardless of who wrote it
  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string) {
    return this.commentsService.adminRemove(Number(commentId));
  }
}
