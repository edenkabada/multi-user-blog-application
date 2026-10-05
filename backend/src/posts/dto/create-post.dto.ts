import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Defines the data required to create a new post
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;
}
