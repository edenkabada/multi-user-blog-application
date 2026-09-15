import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from './post.entity';

@Entity('PostLikes')
export class PostLike {
  @PrimaryGeneratedColumn({ name: 'like_id' })
  likeId!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'post_id' })
  postId!: number;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post!: Post;
}