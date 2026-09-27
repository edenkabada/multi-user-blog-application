import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { AdminModule } from './admin/admin.module';

// Selects the database driver. Defaults to 'mysql' so existing local dev
// setups keep working unchanged; set DB_TYPE=postgres for Neon/production.
const dbType = process.env.DB_TYPE === 'postgres' ? 'postgres' : 'mysql';

// Neon (and most managed Postgres hosts) require SSL; local MySQL/Postgres
// typically doesn't need or support it, so this defaults to off.
const dbSsl = process.env.DB_SSL === 'true';

@Module({
  imports: [
    // Load environment variables from the .env file
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configure the connection between the application and the database.
    // Supports both MySQL (default, local dev) and PostgreSQL (Neon,
    // production) via DB_TYPE/DB_SSL — see .env.example.
    TypeOrmModule.forRoot({
      type: dbType,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: dbSsl ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
      synchronize: false,
    }),
    UsersModule,
    PostsModule,
    AuthModule,
    CommentsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
