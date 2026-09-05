import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  // Create a follow relationship from followerId -> followingId.
  // Rejects self-follows and duplicate follows.
  async follow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      throw new ConflictException('You are already following this user');
    }

    const follow = this.followRepository.create({ followerId, followingId });

    return this.followRepository.save(follow);
  }

  // Remove a follow relationship, if one exists. Unfollowing someone you
  // don't follow is treated as a no-op success rather than an error.
  async unfollow(followerId: number, followingId: number) {
    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (!existing) {
      return { message: 'Not following this user' };
    }

    await this.followRepository.remove(existing);

    return { message: 'Unfollowed successfully' };
  }

  // Count how many users follow this user
  async getFollowerCount(userId: number): Promise<number> {
    return this.followRepository.count({ where: { followingId: userId } });
  }

  // Count how many users this user follows
  async getFollowingCount(userId: number): Promise<number> {
    return this.followRepository.count({ where: { followerId: userId } });
  }

  // Check whether followerId currently follows followingId. Used by
  // GET /users/:id/follow-status so the frontend can show the correct
  // Follow/Unfollow button state without guessing.
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    return !!existing;
  }
}
