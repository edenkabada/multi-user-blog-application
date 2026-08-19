import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';

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
}
