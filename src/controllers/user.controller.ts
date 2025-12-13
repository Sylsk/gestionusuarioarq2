import { Controller } from '@nestjs/common';
import { Ctx, GrpcMethod, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
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

  // Escuchar mensajes de RabbitMQ
  @MessagePattern('validate_user')
  async validateUserRabbit(@Payload() data: { uid: string }, @Ctx() context: RmqContext) {
    const originalMsg = context.getMessage();
    const { properties } = originalMsg;
    console.log('RabbitMQ: Validating user with UID:', data.uid);
    console.log('RabbitMQ Message Properties:', {
      replyTo: properties.replyTo,
      correlationId: properties.correlationId
    });

    try {
      const user = await this.userService.getUserByUid(data.uid);
      if (!user) {
        console.log('User not found in DB');
        return { isValid: false, message: 'User not found' };
      }
      console.log('User found, returning success response');
      return { 
        isValid: true, 
        user: {
          uid: user.uid,
          email: user.email,
          rol: user.rol,
          nombreCompleto: user.nombre_completo
        }
      };
    } catch (error) {
      console.error('Error validating user via RabbitMQ:', error);
      const response = { isValid: false, error: error.message };
      console.log('Returning error response to RabbitMQ:', response);
      return response;
    }
  }

  @GrpcMethod('UserService', 'ValidateUser')
  async validateUser(data: ValidateUserRequest) {
    try {
      const token = (data as any).firebaseToken || data.firebase_token;
      
      const result = await this.userService.validateUser(token);
      
      if (!result.isValid || !result.user) {
        const errorResponse = {
          isValid: 0, // 0 = false
          user: {
            uid: "",
            email: "",
            rol: "",
            nombreCompleto: "",
            createdAt: "",
            updatedAt: "",
          },
          errorMessage: result.error || 'Usuario no válido',
        };
        return errorResponse;
      }
      
      return {
        isValid: 1, // 1 = true
        user: {
          uid: String(result.user.uid),
          email: String(result.user.email),
          rol: String(result.user.rol),
          nombreCompleto: String(result.user.nombre_completo),
          createdAt: String(result.user.created_at.toISOString()),
          updatedAt: String(result.user.updated_at.toISOString()),
        },
        errorMessage: "",
      };
    } catch (error) {
      return {
        isValid: 0, // 0 = false
        user: {
          uid: "",
          email: "",
          rol: "",
          nombreCompleto: "",
          createdAt: "",
          updatedAt: "",
        },
        errorMessage: error.message,
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
          uid: String(user.uid || ''),
          email: String(user.email || ''),
          rol: String(user.rol || ''),
          nombreCompleto: String(user.nombre_completo || ''),
          createdAt: user.created_at ? String(user.created_at.toISOString()) : '',
          updatedAt: user.updated_at ? String(user.updated_at.toISOString()) : '',
        },
        errorMessage: '',
      };
    } catch (error) {
      return {
        found: false,
        user: {
          uid: "",
          email: "",
          rol: "",
          nombreCompleto: "",
          createdAt: "",
          updatedAt: "",
        },
        errorMessage: error.message,
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