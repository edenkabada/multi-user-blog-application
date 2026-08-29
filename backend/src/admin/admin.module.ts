import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { PostsModule } from '../posts/posts.module';
import { AuthModule } from '../auth/auth.module';

// Wires the admin dashboard's endpoints to the existing Users/Posts
// services -- no new entities or database access of its own.
@Module({
  imports: [UsersModule, PostsModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
