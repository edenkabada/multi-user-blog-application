import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { username, email, password } = registerUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = this.userRepository.create({
    username,
    email,
    password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    
    const { password: _, ...result } = savedUser;
    
    return result;
  }
  

}

