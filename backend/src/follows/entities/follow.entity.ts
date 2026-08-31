import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// Defines the Follow entity and maps it to the Follows table in the
// database. Represents a directed follower -> following relationship.
@Entity('Follows')
export class Follow {
  @PrimaryGeneratedColumn({ name: 'follow_id' })
  followId: number;

  @Column({ name: 'follower_id' })
  followerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @Column({ name: 'following_id' })
  followingId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'following_id' })
  following: User;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
