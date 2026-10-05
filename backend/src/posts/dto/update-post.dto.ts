import { IsOptional, IsString } from 'class-validator';

// Defines the data that can be updated for an existing post
export class UpdatePostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}