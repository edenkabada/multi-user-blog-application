import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Defines the data required to create a new post
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
