import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseService } from './firebase.service';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

jest.mock('firebase-admin', () => {
  const mockAuth = {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
  };

  return {
    apps: { length: 0 },
    initializeApp: jest.fn(),
    auth: jest.fn(() => mockAuth),
    credential: {
      cert: jest.fn(),
    },
  };
});

describe('FirebaseService', () => {
  let service: FirebaseService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_PRIVATE_KEY_ID: 'test-key-id',
        FIREBASE_PRIVATE_KEY: 'test-private-key\\nwith\\nnewlines',
        FIREBASE_CLIENT_EMAIL: 'test@test.com',
        FIREBASE_CLIENT_ID: 'test-client-id',
        FIREBASE_CLIENT_CERT_URL: 'https://test-cert-url.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize firebase on module init', () => {
    service.onModuleInit();
    expect(admin.initializeApp).toHaveBeenCalled();
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      const mockDecodedToken = {
        uid: 'test-uid',
        email: 'test@test.com',
      };

      const mockAuth = admin.auth();
      (mockAuth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(mockDecodedToken);
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
    });

    it('should throw error for invalid token', async () => {
      const mockAuth = admin.auth();
      (mockAuth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Token expired'));

      await expect(service.verifyToken('invalid-token')).rejects.toThrow('Invalid Firebase token');
    });
  });

  describe('getUserByUid', () => {
    it('should get user by uid successfully', async () => {
      const mockUserRecord = {
        uid: 'test-uid',
        email: 'test@test.com',
      };

      const mockAuth = admin.auth();
      (mockAuth.getUser as jest.Mock).mockResolvedValue(mockUserRecord);

      const result = await service.getUserByUid('test-uid');

      expect(result).toEqual(mockUserRecord);
      expect(mockAuth.getUser).toHaveBeenCalledWith('test-uid');
    });

    it('should throw error when user not found', async () => {
      const mockAuth = admin.auth();
      (mockAuth.getUser as jest.Mock).mockRejectedValue(new Error('User not found'));

      await expect(service.getUserByUid('non-existent-uid')).rejects.toThrow('User not found in Firebase');
    });
  });
});
