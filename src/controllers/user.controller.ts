import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserRoleDto, ValidateUserDto } from '../dto/user.dto';

interface ValidateUserRequest {
  firebase_token?: string;
  firebaseToken?: string; // gRPC convierte snake_case a camelCase
}

interface CreateUserRequest {
  firebase_token?: string;
  firebaseToken?: string; // gRPC convierte snake_case a camelCase
  email: string;
  nombre_completo: string;
}

interface GetUserByUidRequest {
  uid: string;
}

interface UpdateUserRoleRequest {
  uid: string;
  new_role: string;
}

interface DeleteUserRequest {
  uid: string;
}

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'ValidateUser')
  async validateUser(data: ValidateUserRequest) {
    try {
      // gRPC convierte snake_case a camelCase automáticamente
      const token = (data as any).firebaseToken || data.firebase_token;
      console.log('🔍 gRPC ValidateUser called with token length:', token?.length);
      console.log('🔑 Token prefix:', token?.substring(0, 20) + '...');
      
      const result = await this.userService.validateUser(token);
      
      console.log('✅ ValidateUser result:', { isValid: result.isValid, hasUser: !!result.user, error: result.error });
      
      const response = {
        is_valid: result.isValid,
        user: result.user ? {
          uid: result.user.uid,
          email: result.user.email,
          rol: result.user.rol,
          nombre_completo: result.user.nombre_completo,
          created_at: result.user.created_at.toISOString(),
          updated_at: result.user.updated_at.toISOString(),
        } : null,
        error_message: result.error || '',
      };
      
      console.log('🚀 Returning response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ gRPC ValidateUser error:', error.message);
      return {
        is_valid: false,
        user: null,
        error_message: error.message,
      };
    }
  }

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: CreateUserRequest) {
    try {
      // gRPC convierte snake_case a camelCase automáticamente
      const token = (data as any).firebaseToken || data.firebase_token;
      const createUserDto: CreateUserDto = {
        firebase_token: token,
        email: data.email,
        nombre_completo: data.nombre_completo,
      };

      const user = await this.userService.createUser(createUserDto);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          rol: user.rol,
          nombre_completo: user.nombre_completo,
          created_at: user.created_at.toISOString(),
          updated_at: user.updated_at.toISOString(),
        },
        error_message: '',
      };
    } catch (error) {
      return {
        success: false,
        user: null,
        error_message: error.message,
      };
    }
  }

  @GrpcMethod('UserService', 'GetUserByUid')
  async getUserByUid(data: GetUserByUidRequest) {
    try {
      const user = await this.userService.getUserByUid(data.uid);

      return {
        found: true,
        user: {
          uid: user.uid,
          email: user.email,
          rol: user.rol,
          nombre_completo: user.nombre_completo,
          created_at: user.created_at.toISOString(),
          updated_at: user.updated_at.toISOString(),
        },
        error_message: '',
      };
    } catch (error) {
      return {
        found: false,
        user: null,
        error_message: error.message,
      };
    }
  }

  @GrpcMethod('UserService', 'UpdateUserRole')
  async updateUserRole(data: UpdateUserRoleRequest) {
    try {
      const updateUserRoleDto: UpdateUserRoleDto = {
        uid: data.uid,
        new_role: data.new_role as any,
      };

      const user = await this.userService.updateUserRole(updateUserRoleDto);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          rol: user.rol,
          nombre_completo: user.nombre_completo,
          created_at: user.created_at.toISOString(),
          updated_at: user.updated_at.toISOString(),
        },
        error_message: '',
      };
    } catch (error) {
      return {
        success: false,
        user: null,
        error_message: error.message,
      };
    }
  }

  @GrpcMethod('UserService', 'DeleteUser')
  async deleteUser(data: DeleteUserRequest) {
    try {
      const success = await this.userService.deleteUser(data.uid);

      return {
        success,
        error_message: success ? '' : 'Usuario no encontrado',
      };
    } catch (error) {
      return {
        success: false,
        error_message: error.message,
      };
    }
  }
}