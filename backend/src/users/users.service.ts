import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { FollowsService } from '../follows/follows.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly followsService: FollowsService,
  ) {}

  // Register a new user and save the user data in the database
  async register(registerUserDto: RegisterUserDto) {
    const { username, email, password } = registerUserDto;

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    let savedUser;

    try {
      savedUser = await this.userRepository.save(user);
    } catch (error) {
      // Handle duplicate username or email errors
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('users.username')) {
          throw new ConflictException('Username already exists');
        }

        if (error.message.includes('users.email')) {
          throw new ConflictException('Email already exists');
        }
      }

      throw error;
    }

    // Remove the password from the response
    const { password: _, ...result } = savedUser;

    return result;
  }

  // Authenticate the user and generate an access token
  async login(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Compare the entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Create the JWT payload with the user's information
    const payload = {
      sub: user.userId,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
    };
  }

  // Return the authenticated user's own profile. Never includes the
  // password hash, and only exposes the fields SCRUM-38 specifies, plus
  // follower/following counts added in SCRUM-42.
  async findMe(userId: number) {
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [followerCount, followingCount] = await Promise.all([
      this.followsService.getFollowerCount(userId),
      this.followsService.getFollowingCount(userId),
    ]);

    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      followerCount,
      followingCount,
    };
  }

  // Return public profile fields for any user by id. Deliberately excludes
  // email as well as password, since this is viewable by anyone. Includes
  // follower/following counts added in SCRUM-42.
  async findPublicProfile(id: number) {
    if (Number.isNaN(id)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userRepository.findOne({ where: { userId: id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [followerCount, followingCount] = await Promise.all([
      this.followsService.getFollowerCount(id),
      this.followsService.getFollowingCount(id),
    ]);

    return {
      userId: user.userId,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      followerCount,
      followingCount,
    };
  }

  // Check whether a user with this id exists, without exposing profile
  // fields. Used as a 404 guard by endpoints like GET /users/:id/posts
  // that delegate the actual data-fetching to another service.
  async userExists(id: number): Promise<boolean> {
    if (Number.isNaN(id)) {
      return false;
    }

    const user = await this.userRepository.findOne({
      where: { userId: id },
      select: { userId: true },
    });

    return !!user;
  }
}
