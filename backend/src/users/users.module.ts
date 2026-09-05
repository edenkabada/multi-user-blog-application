import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Configure the Users module and its dependencies
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    // registerAsync resolves JWT_SECRET via ConfigService at DI time,
    // rather than reading process.env.JWT_SECRET when this file's
    // decorator evaluates (which happens before AppModule's
    // ConfigModule.forRoot() has loaded the .env file).
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
