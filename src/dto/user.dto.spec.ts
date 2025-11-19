import { validate } from 'class-validator';
import { CreateUserDto, UpdateUserRoleDto, ValidateUserDto } from './user.dto';
import { UserRole } from '../entities/user.entity';

describe('User DTOs', () => {
  describe('CreateUserDto', () => {
    it('should validate correct CreateUserDto', async () => {
      const dto = new CreateUserDto();
      dto.firebase_token = 'test-token';
      dto.email = 'test@alumnos.ucn.cl';
      dto.nombre_completo = 'Test User';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation without firebase_token', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@alumnos.ucn.cl';
      dto.nombre_completo = 'Test User';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = new CreateUserDto();
      dto.firebase_token = 'test-token';
      dto.email = 'invalid-email';
      dto.nombre_completo = 'Test User';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation without nombre_completo', async () => {
      const dto = new CreateUserDto();
      dto.firebase_token = 'test-token';
      dto.email = 'test@alumnos.ucn.cl';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateUserRoleDto', () => {
    it('should validate correct UpdateUserRoleDto', async () => {
      const dto = new UpdateUserRoleDto();
      dto.uid = 'test-uid-123';
      dto.new_role = UserRole.ADMIN;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation without uid', async () => {
      const dto = new UpdateUserRoleDto();
      dto.new_role = UserRole.ADMIN;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with invalid role', async () => {
      const dto = new UpdateUserRoleDto();
      dto.uid = 'test-uid-123';
      dto.new_role = 'InvalidRole' as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ValidateUserDto', () => {
    it('should validate correct ValidateUserDto', async () => {
      const dto = new ValidateUserDto();
      dto.firebase_token = 'test-token';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation without firebase_token', async () => {
      const dto = new ValidateUserDto();

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with empty firebase_token', async () => {
      const dto = new ValidateUserDto();
      dto.firebase_token = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
