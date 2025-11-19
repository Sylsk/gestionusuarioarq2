import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../entities/user.entity';
import { FirebaseService } from './firebase.service';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let firebaseService: FirebaseService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockFirebaseService = {
    verifyToken: jest.fn(),
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
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    firebaseService = module.get<FirebaseService>(FirebaseService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate and return existing user', async () => {
      const token = 'valid-token';
      const decodedToken = {
        uid: 'test-uid-123',
        email: 'test@alumnos.ucn.cl',
      };

      mockFirebaseService.verifyToken.mockResolvedValue(decodedToken);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(token);

      expect(result.isValid).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(firebaseService.verifyToken).toHaveBeenCalledWith(token);
    });

    it('should create new user if not exists with authorized email', async () => {
      const token = 'valid-token';
      const decodedToken = {
        uid: 'new-uid-456',
        email: 'newuser@alumnos.ucn.cl',
        name: 'New User',
      };

      const newUser: User = {
        uid: 'new-uid-456',
        email: 'newuser@alumnos.ucn.cl',
        rol: UserRole.TUTOR,
        nombre_completo: 'New User',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockFirebaseService.verifyToken.mockResolvedValue(decodedToken);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const result = await service.validateUser(token);

      expect(result.isValid).toBe(true);
      expect(result.user).toEqual(newUser);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should reject unauthorized email domain', async () => {
      const token = 'valid-token';
      const decodedToken = {
        uid: 'test-uid',
        email: 'unauthorized@gmail.com',
      };

      mockFirebaseService.verifyToken.mockResolvedValue(decodedToken);
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(token);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('no autorizado');
    });

    it('should reject if token has no email', async () => {
      const token = 'valid-token';
      const decodedToken = {
        uid: 'test-uid',
      };

      mockFirebaseService.verifyToken.mockResolvedValue(decodedToken);
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(token);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('email');
    });

    it('should handle firebase token verification error', async () => {
      const token = 'invalid-token';
      mockFirebaseService.verifyToken.mockRejectedValue(new Error('Invalid token'));

      const result = await service.validateUser(token);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid token');
    });

    it('should allow silasglauco@gmail.com as admin', async () => {
      const token = 'valid-token';
      const decodedToken = {
        uid: 'admin-uid',
        email: 'silasglauco@gmail.com',
        name: 'Admin User',
      };

      const adminUser: User = {
        uid: 'admin-uid',
        email: 'silasglauco@gmail.com',
        rol: UserRole.ADMIN,
        nombre_completo: 'Admin User',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockFirebaseService.verifyToken.mockResolvedValue(decodedToken);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(adminUser);
      mockUserRepository.save.mockResolvedValue(adminUser);

      const result = await service.validateUser(token);

      expect(result.isValid).toBe(true);
      expect(result.user?.rol).toBe(UserRole.ADMIN);
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        firebase_token: 'valid-token',
        email: 'test@alumnos.ucn.cl',
        nombre_completo: 'Test User',
      };

      const decodedToken = {
        uid: 'new-uid',
        email: 'test@alumnos.ucn.cl',
      };

      mockFirebaseService.verifyToken.mockResolvedValue(decodedToken);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const createUserDto = {
        firebase_token: 'valid-token',
        email: 'test@alumnos.ucn.cl',
        nombre_completo: 'Test User',
      };

      const decodedToken = {
        uid: 'existing-uid',
        email: 'test@alumnos.ucn.cl',
      };

      mockFirebaseService.verifyToken.mockResolvedValue(decodedToken);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(BadRequestException);
    });

    it('should reject unauthorized email domain', async () => {
      const createUserDto = {
        firebase_token: 'valid-token',
        email: 'unauthorized@gmail.com',
        nombre_completo: 'Test User',
      };

      const decodedToken = {
        uid: 'new-uid',
        email: 'unauthorized@gmail.com',
      };

      mockFirebaseService.verifyToken.mockResolvedValue(decodedToken);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.createUser(createUserDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserByUid', () => {
    it('should return user when found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserByUid('test-uid-123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { uid: 'test-uid-123' } });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserByUid('non-existent-uid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const updateDto = {
        uid: 'test-uid-123',
        new_role: UserRole.ADMIN,
      };

      const updatedUser = { ...mockUser, rol: UserRole.ADMIN };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUserRole(updateDto);

      expect(result.rol).toBe(UserRole.ADMIN);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateDto = {
        uid: 'non-existent-uid',
        new_role: UserRole.ADMIN,
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.updateUserRole(updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return true', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.deleteUser('test-uid-123');

      expect(result).toBe(true);
      expect(mockUserRepository.delete).toHaveBeenCalledWith({ uid: 'test-uid-123' });
    });

    it('should return false when user not found', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 0, raw: [] });

      const result = await service.deleteUser('non-existent-uid');

      expect(result).toBe(false);
    });

    it('should handle undefined affected count', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: undefined, raw: [] });

      const result = await service.deleteUser('test-uid');

      expect(result).toBe(false);
    });
  });
});
