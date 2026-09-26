import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Defines the data required to create a new comment
export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
