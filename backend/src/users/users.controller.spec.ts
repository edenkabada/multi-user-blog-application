import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';

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
});
