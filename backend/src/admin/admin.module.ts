import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';
import { AuthModule } from '../auth/auth.module';

// Wires the admin dashboard's endpoints to the existing Users/Posts/
// Comments services -- no new entities or database access of its own.
@Module({
  imports: [UsersModule, PostsModule, CommentsModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
