import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,

        @InjectRepository(PostLike)
        private readonly postLikeRepository: Repository<PostLike>,
    ) { }

    // Create a new post and associate it with the authenticated user
    async create(
        createPostDto: CreatePostDto,
        user: { userId: number; username: string },
    ) {
        const post = this.postRepository.create({
            userId: user.userId,
            title: createPostDto.title,
            content: createPostDto.content,
        });

        return this.postRepository.save(post);
    }

    // Retrieve all posts with their authors
    async findAll(userId: number | null) {
        const posts = await this.postRepository.find({
            relations: {
                user: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });

        // Return post details 
        return Promise.all(
            posts.map(async (post) => {
                const likesCount = await this.postLikeRepository.count({
                    where: { postId: post.postId },
                });

                const likedByCurrentUser =
                    userId !== null &&
                    await this.postLikeRepository.exists({
                        where: {
                            postId: post.postId,
                            userId,
                        },
                    });

                return {
                    postId: post.postId,
                    title: post.title,
                    content: post.content,
                    createdAt: post.createdAt,
                    username: post.user.username,
                    userId: post.userId,
                    updatedAt: post.updatedAt,
                    likesCount,
                    likedByCurrentUser,
                };
            }),
        );
    }

    // Retrieve a specific post by its ID
    async findOne(postId: number, userId: number | null) {
        const post = await this.postRepository.findOne({
            where: { postId },
            relations: {
                user: true,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const likesCount = await this.postLikeRepository.count({
            where: { postId: post.postId },
        });

        const likedByCurrentUser =
            userId !== null &&
            await this.postLikeRepository.exists({
                where: {
                    postId: post.postId,
                    userId,
                },
            });

        // Return post details 
        return {
            postId: post.postId,
            title: post.title,
            content: post.content,
            createdAt: post.createdAt,
            username: post.user.username,
            userId: post.userId,
            updatedAt: post.updatedAt,
            likesCount,
            likedByCurrentUser,
        };
    }

    // Update an existing post owned by the authenticated user
    async update(
        postId: number,
        updatePostDto: UpdatePostDto,
        user: { userId: number; username: string },
    ) {
        const post = await this.postRepository.findOne({
            where: { postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.userId !== user.userId) {
            throw new ForbiddenException('You are not allowed to update this post');
        }

        post.title = updatePostDto.title ?? post.title;
        post.content = updatePostDto.content ?? post.content;

        return this.postRepository.save(post);
    }

    // Delete an existing post owned by the authenticated user
    async remove(
        postId: number,
        user: { userId: number; username: string },
    ) {
        const post = await this.postRepository.findOne({
            where: { postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.userId !== user.userId) {
            throw new ForbiddenException('You are not allowed to delete this post');
        }

        await this.postRepository.remove(post);

        return {
            message: 'Post deleted successfully',
        };
    }

    // Adds a like to a post for the authenticated user
    async likePost(
        postId: number,
        userId: number,
    ) {
        const like = this.postLikeRepository.create({
            postId,
            userId,
        });

        return this.postLikeRepository.save(like);
    }

    // Removes the authenticated user's like from a post
    async unlikePost(
        postId: number,
        userId: number,
    ) {
        await this.postLikeRepository.delete({
            postId,
            userId,
        });
    }
}
