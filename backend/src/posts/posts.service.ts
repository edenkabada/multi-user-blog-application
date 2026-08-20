import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
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

        // Save the new post to the database
        return this.postRepository.save(post);
    }

    // Retrieve all posts from the database
    async findAll() {
        return this.postRepository.find();
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
}
