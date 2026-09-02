import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { findMe: jest.Mock; findPublicProfile: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findMe: jest.fn(),
      findPublicProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
      usersService.findMe.mockResolvedValue(expectedProfile);

      const req = { user: { userId: 1, username: 'alice' } };
      const result = await controller.getMe(req);

      expect(usersService.findMe).toHaveBeenCalledWith(1);
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
      usersService.findPublicProfile.mockResolvedValue(expectedProfile);

      const result = await controller.getUserById('2');

      expect(usersService.findPublicProfile).toHaveBeenCalledWith(2);
      expect(result).toEqual(expectedProfile);
    });
  });
});
