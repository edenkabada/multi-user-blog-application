import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowsService } from './follows.service';
import { Follow } from './entities/follow.entity';

// Configure the Follows module and its dependencies. No controller of its
// own — follow/unfollow endpoints live on UsersController, consistent with
// how posts/comments/activity are exposed under /users/:id/...
@Module({
  imports: [TypeOrmModule.forFeature([Follow])],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
