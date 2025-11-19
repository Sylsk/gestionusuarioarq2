import { User, UserRole } from './user.entity';

describe('User Entity', () => {
  it('should create a user instance', () => {
    const user = new User();
    user.uid = 'test-uid-123';
    user.email = 'test@alumnos.ucn.cl';
    user.rol = UserRole.TUTOR;
    user.nombre_completo = 'Test User';
    user.created_at = new Date();
    user.updated_at = new Date();

    expect(user).toBeDefined();
    expect(user.uid).toBe('test-uid-123');
    expect(user.email).toBe('test@alumnos.ucn.cl');
    expect(user.rol).toBe(UserRole.TUTOR);
    expect(user.nombre_completo).toBe('Test User');
  });

  it('should have TUTOR role enum value', () => {
    expect(UserRole.TUTOR).toBe('Tutor');
  });

  it('should have ADMIN role enum value', () => {
    expect(UserRole.ADMIN).toBe('Admin');
  });

  it('should allow setting all user properties', () => {
    const user = new User();
    const now = new Date();

    user.uid = 'admin-uid';
    user.email = 'admin@test.com';
    user.rol = UserRole.ADMIN;
    user.nombre_completo = 'Admin User';
    user.created_at = now;
    user.updated_at = now;

    expect(user.uid).toBe('admin-uid');
    expect(user.email).toBe('admin@test.com');
    expect(user.rol).toBe(UserRole.ADMIN);
    expect(user.nombre_completo).toBe('Admin User');
    expect(user.created_at).toBe(now);
    expect(user.updated_at).toBe(now);
  });
});
