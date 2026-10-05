import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { Comment } from '../comments/entities/comment.entity';
import { CommentLike } from '../comments/entities/comment-like.entity';
import { AuthModule } from '../auth/auth.module';

// Configure the Posts module and its dependencies
@Module({
  imports: [TypeOrmModule.forFeature([Post, PostLike, Comment, CommentLike]), AuthModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
