import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            findMe: jest.fn(),
            findPublicProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates registration to UsersService and returns its result', async () => {
    const dto: RegisterUserDto = {
      username: 'alon',
      email: 'alon@example.com',
      password: 'password123',
    };
    const expected = { userId: 1, username: dto.username, email: dto.email };
    service.register.mockResolvedValue(expected as never);

    const result = await controller.register(dto);

    expect(service.register).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('delegates login to UsersService and returns its result', async () => {
    const dto: LoginUserDto = { username: 'alon', password: 'password123' };
    const expected = { access_token: 'signed-jwt' };
    service.login.mockResolvedValue(expected);

    const result = await controller.login(dto);

    expect(service.login).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  describe('getMe', () => {
    it('calls usersService.findMe with the authenticated user id from the request', async () => {
      const expectedProfile = {
        userId: 1,
        username: 'alice',
        email: 'alice@example.com',
        role: 'user',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      service.findMe.mockResolvedValue(expectedProfile);

      const req = { user: { userId: 1, username: 'alice' } };
      const result = await controller.getMe(req);

      expect(service.findMe).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedProfile);
    });
  });

  describe('getUserById', () => {
    it('calls usersService.findPublicProfile with the numeric id from the route param', async () => {
      const expectedProfile = {
        userId: 2,
        username: 'bob',
        role: 'user',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      service.findPublicProfile.mockResolvedValue(expectedProfile);

      const result = await controller.getUserById('2');

      expect(service.findPublicProfile).toHaveBeenCalledWith(2);
      expect(result).toEqual(expectedProfile);
    });
  });
});
