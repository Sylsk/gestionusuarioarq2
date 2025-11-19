import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { User, UserRole } from '../entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    validateUser: jest.fn(),
    createUser: jest.fn(),
    getUserByUid: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockUser: User = {
    uid: 'test-uid-123',
    email: 'test@alumnos.ucn.cl',
    rol: UserRole.TUTOR,
    nombre_completo: 'Test User',
    created_at: new Date('2023-01-01T00:00:00.000Z'),
    updated_at: new Date('2023-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate user successfully with firebaseToken', async () => {
      const request = { firebaseToken: 'valid-token' };
      mockUserService.validateUser.mockResolvedValue({
        isValid: true,
        user: mockUser,
      });

      const result = await controller.validateUser(request);

      expect(result.isValid).toBe(1);
      expect(result.user.uid).toBe('test-uid-123');
      expect(result.user.email).toBe('test@alumnos.ucn.cl');
      expect(result.errorMessage).toBe('');
      expect(mockUserService.validateUser).toHaveBeenCalledWith('valid-token');
    });

    it('should validate user successfully with firebase_token', async () => {
      const request = { firebase_token: 'valid-token' };
      mockUserService.validateUser.mockResolvedValue({
        isValid: true,
        user: mockUser,
      });

      const result = await controller.validateUser(request);

      expect(result.isValid).toBe(1);
      expect(result.user.uid).toBe('test-uid-123');
      expect(mockUserService.validateUser).toHaveBeenCalledWith('valid-token');
    });

    it('should return error when user is not valid', async () => {
      const request = { firebaseToken: 'invalid-token' };
      mockUserService.validateUser.mockResolvedValue({
        isValid: false,
        error: 'Token inválido',
      });

      const result = await controller.validateUser(request);

      expect(result.isValid).toBe(0);
      expect(result.user.uid).toBe('');
      expect(result.errorMessage).toBe('Token inválido');
    });

    it('should handle exception during validation', async () => {
      const request = { firebaseToken: 'error-token' };
      mockUserService.validateUser.mockRejectedValue(new Error('Service error'));

      const result = await controller.validateUser(request);

      expect(result.isValid).toBe(0);
      expect(result.errorMessage).toBe('Service error');
    });

    it('should handle missing user in valid response', async () => {
      const request = { firebaseToken: 'valid-token' };
      mockUserService.validateUser.mockResolvedValue({
        isValid: true,
        user: null,
      });

      const result = await controller.validateUser(request);

      expect(result.isValid).toBe(0);
      expect(result.errorMessage).toBe('Usuario no válido');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const request = {
        firebaseToken: 'valid-token',
        email: 'test@alumnos.ucn.cl',
        nombre_completo: 'Test User',
      };

      mockUserService.createUser.mockResolvedValue(mockUser);

      const result = await controller.createUser(request);

      expect(result.success).toBe(true);
      expect(result.user).not.toBeNull();
      expect(result.user?.uid).toBe('test-uid-123');
      expect(result.error_message).toBe('');
    });

    it('should handle creation error', async () => {
      const request = {
        firebaseToken: 'valid-token',
        email: 'test@alumnos.ucn.cl',
        nombre_completo: 'Test User',
      };

      mockUserService.createUser.mockRejectedValue(new Error('Creation failed'));

      const result = await controller.createUser(request);

      expect(result.success).toBe(false);
      expect(result.user).toBeNull();
      expect(result.error_message).toBe('Creation failed');
    });
  });

  describe('getUserByUid', () => {
    it('should get user by uid successfully', async () => {
      const request = { uid: 'test-uid-123' };
      mockUserService.getUserByUid.mockResolvedValue(mockUser);

      const result = await controller.getUserByUid(request);

      expect(result.found).toBe(true);
      expect(result.user.uid).toBe('test-uid-123');
      expect(result.user.email).toBe('test@alumnos.ucn.cl');
      expect(result.errorMessage).toBe('');
    });

    it('should handle user not found', async () => {
      const request = { uid: 'non-existent-uid' };
      mockUserService.getUserByUid.mockRejectedValue(new Error('User not found'));

      const result = await controller.getUserByUid(request);

      expect(result.found).toBe(false);
      expect(result.user.uid).toBe('');
      expect(result.errorMessage).toBe('User not found');
    });

    it('should handle null or undefined user fields', async () => {
      const request = { uid: 'test-uid' };
      const partialUser = {
        uid: null,
        email: null,
        rol: null,
        nombre_completo: null,
        created_at: null,
        updated_at: null,
      };
      mockUserService.getUserByUid.mockResolvedValue(partialUser as any);

      const result = await controller.getUserByUid(request);

      expect(result.found).toBe(true);
      expect(result.user.uid).toBe('');
      expect(result.user.email).toBe('');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const request = {
        uid: 'test-uid-123',
        new_role: 'Admin',
      };

      const updatedUser = { ...mockUser, rol: UserRole.ADMIN };
      mockUserService.updateUserRole.mockResolvedValue(updatedUser);

      const result = await controller.updateUserRole(request);

      expect(result.success).toBe(true);
      expect(result.user).not.toBeNull();
      expect(result.user?.rol).toBe(UserRole.ADMIN);
      expect(result.error_message).toBe('');
    });

    it('should handle update error', async () => {
      const request = {
        uid: 'test-uid-123',
        new_role: 'Admin',
      };

      mockUserService.updateUserRole.mockRejectedValue(new Error('Update failed'));

      const result = await controller.updateUserRole(request);

      expect(result.success).toBe(false);
      expect(result.user).toBeNull();
      expect(result.error_message).toBe('Update failed');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const request = { uid: 'test-uid-123' };
      mockUserService.deleteUser.mockResolvedValue(true);

      const result = await controller.deleteUser(request);

      expect(result.success).toBe(true);
      expect(result.error_message).toBe('');
    });

    it('should handle user not found during deletion', async () => {
      const request = { uid: 'non-existent-uid' };
      mockUserService.deleteUser.mockResolvedValue(false);

      const result = await controller.deleteUser(request);

      expect(result.success).toBe(false);
      expect(result.error_message).toBe('Usuario no encontrado');
    });

    it('should handle deletion error', async () => {
      const request = { uid: 'test-uid-123' };
      mockUserService.deleteUser.mockRejectedValue(new Error('Deletion error'));

      const result = await controller.deleteUser(request);

      expect(result.success).toBe(false);
      expect(result.error_message).toBe('Deletion error');
    });
  });
});
