import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

// Defines the data that can be updated on the authenticated user's own
// profile. Both fields are optional, since a client may want to update
// just one of them.
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  username?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
