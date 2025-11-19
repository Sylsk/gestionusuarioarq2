import { Test, TestingModule } from '@nestjs/testing';
import { TestController } from './test.controller';
import { UserService } from '../services/user.service';
import { User, UserRole } from '../entities/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('TestController', () => {
  let controller: TestController;
  let userService: UserService;

  const mockUserService = {
    validateUser: jest.fn(),
    createUser: jest.fn(),
    getUserByUid: jest.fn(),
  };

  const mockUser: User = {
    uid: 'test-uid-123',
    email: 'test@alumnos.ucn.cl',
    rol: UserRole.TUTOR,
    nombre_completo: 'Test User',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<TestController>(TestController);
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('loginUser', () => {
    it('should login existing user successfully', async () => {
      const body = {
        firebase_token: 'valid-token',
        email: 'test@alumnos.ucn.cl',
        nombre_completo: 'Test User',
      };

      mockUserService.validateUser.mockResolvedValue({
        isValid: true,
        user: mockUser,
      });

      const result = await controller.loginUser(body);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.source).toBe('existing_user');
    });

    it('should create new user on first login', async () => {
      const body = {
        firebase_token: 'valid-token',
        email: 'newuser@alumnos.ucn.cl',
        nombre_completo: 'New User',
      };

      mockUserService.validateUser.mockResolvedValue({
        isValid: false,
      });

      mockUserService.createUser.mockResolvedValue({
        ...mockUser,
        email: 'newuser@alumnos.ucn.cl',
        nombre_completo: 'New User',
      });

      const result = await controller.loginUser(body);

      expect(result.success).toBe(true);
      expect(result.source).toBe('new_user');
    });

    it('should reject unauthorized email domain', async () => {
      const body = {
        firebase_token: 'valid-token',
        email: 'unauthorized@gmail.com',
        nombre_completo: 'Unauthorized User',
      };

      const result = await controller.loginUser(body);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain('no autorizado');
    });

    it('should allow silasglauco@gmail.com', async () => {
      const body = {
        firebase_token: 'valid-token',
        email: 'silasglauco@gmail.com',
        nombre_completo: 'Admin User',
      };

      mockUserService.validateUser.mockResolvedValue({
        isValid: true,
        user: { ...mockUser, email: 'silasglauco@gmail.com', rol: UserRole.ADMIN },
      });

      const result = await controller.loginUser(body);

      expect(result.success).toBe(true);
    });

    it('should create mock user when Firebase fails', async () => {
      const body = {
        firebase_token: 'valid-token',
        email: 'test@alumnos.ucn.cl',
        nombre_completo: 'Test User',
      };

      mockUserService.validateUser.mockRejectedValue(new Error('Firebase error'));

      const result = await controller.loginUser(body);

      expect(result.success).toBe(true);
      expect(result.source).toBe('mock');
      expect(result.user).toBeDefined();
    });
  });

  describe('createTestUser', () => {
    it('should create user with Firebase token', async () => {
      const body = {
        firebase_token: 'valid-token',
        email: 'test@alumnos.ucn.cl',
        nombre_completo: 'Test User',
      };

      mockUserService.createUser.mockResolvedValue(mockUser);

      const result = await controller.createTestUser(body);

      expect(result.success).toBe(true);
      expect(result.source).toBe('firebase');
    });

    it('should create mock user without Firebase token', async () => {
      const body = {
        email: 'test@alumnos.ucn.cl',
        nombre_completo: 'Test User',
      };

      const result = await controller.createTestUser(body);

      expect(result.success).toBe(true);
      expect(result.source).toBe('test');
      expect(result.user.rol).toBe(UserRole.TUTOR);
    });

    it('should reject unauthorized email', async () => {
      const body = {
        email: 'unauthorized@gmail.com',
        nombre_completo: 'Unauthorized User',
      };

      const result = await controller.createTestUser(body);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain('no autorizado');
    });

    it('should create mock user when Firebase fails', async () => {
      const body = {
        firebase_token: 'invalid-token',
        email: 'test@alumnos.ucn.cl',
        nombre_completo: 'Test User',
      };

      mockUserService.createUser.mockRejectedValue(new Error('Firebase error'));

      const result = await controller.createTestUser(body);

      expect(result.success).toBe(true);
      expect(result.source).toBe('mock');
    });

    it('should create admin user for eduardo.ericesp@gmail.com', async () => {
      const body = {
        email: 'eduardo.ericesp@gmail.com',
        nombre_completo: 'Eduardo User',
      };

      const result = await controller.createTestUser(body);

      expect(result.success).toBe(true);
      expect(result.user.rol).toBe(UserRole.ADMIN);
    });

    it('should use provided uid when creating test user', async () => {
      const body = {
        email: 'test@alumnos.ucn.cl',
        nombre_completo: 'Test User',
        uid: 'custom-uid-123',
      };

      const result = await controller.createTestUser(body);

      expect(result.success).toBe(true);
      expect(result.user.uid).toBe('custom-uid-123');
    });
  });

  describe('getTestUser', () => {
    it('should get user by uid successfully', async () => {
      mockUserService.getUserByUid.mockResolvedValue(mockUser);

      const result = await controller.getTestUser('test-uid-123');

      expect(result.found).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      mockUserService.getUserByUid.mockRejectedValue(new Error('User not found'));

      const result = await controller.getTestUser('non-existent-uid');

      expect(result.found).toBe(false);
      expect(result.error_message).toBe('User not found');
    });
  });

  describe('testDatabase', () => {
    it('should return database test success', async () => {
      const result = await controller.testDatabase();

      expect(result.success).toBe(true);
      expect(result.database).toBe('PostgreSQL');
    });
  });

  describe('getAllUsers', () => {
    it('should return mock users list', async () => {
      const result = await controller.getAllUsers();

      expect(result.success).toBe(true);
      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const result = await controller.healthCheck();

      expect(result.status).toBe('OK');
      expect(result.message).toBe('Service is running');
      expect(result.timestamp).toBeDefined();
    });
  });
});
