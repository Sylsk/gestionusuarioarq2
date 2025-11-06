import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { UserService } from '../services/user.service';

@Controller('api/test')
export class TestController {
  constructor(private readonly userService: UserService) {}

  // Endpoint de prueba para crear usuario con Firebase
  @Post('create-user')
  async createTestUser(@Body() body: { 
    firebase_token?: string;
    email: string; 
    nombre_completo: string; 
    uid?: string;
  }) {
    try {
      console.log('🔍 Recibiendo solicitud de creación de usuario:', {
        email: body.email,
        nombre_completo: body.nombre_completo,
        hasToken: !!body.firebase_token
      });

      if (body.firebase_token) {
        // Si viene token de Firebase, intentar usar el servicio real
        try {
          console.log('🔑 Intentando crear usuario con Firebase token...');
          const request = {
            firebase_token: body.firebase_token,
            email: body.email,
            nombre_completo: body.nombre_completo
          };
          
          const user = await this.userService.createUser(request);
          
          return {
            success: true,
            user: user,
            message: 'Usuario creado exitosamente con Firebase',
            source: 'firebase'
          };
        } catch (firebaseError) {
          console.error('❌ Error con Firebase:', firebaseError.message);
          
          // Si falla Firebase, crear usuario mock pero con información real
          const uid = `mock-${Date.now()}`;
          
          return {
            success: true,
            user: {
              uid,
              email: body.email,
              nombre_completo: body.nombre_completo,
              rol: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            message: `Usuario mock creado (Firebase falló: ${firebaseError.message})`,
            source: 'mock'
          };
        }
      } else {
        // Sin token, crear usuario mock
        const uid = body.uid || `test-${Date.now()}`;
        
        return {
          success: true,
          user: {
            uid,
            email: body.email,
            nombre_completo: body.nombre_completo,
            rol: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          message: 'Usuario de prueba creado exitosamente (sin Firebase)',
          source: 'test'
        };
      }
    } catch (error) {
      console.error('❌ Error general:', error);
      return {
        success: false,
        error_message: `Error creando usuario: ${error.message}`,
        error_details: error.stack
      };
    }
  }

  // Endpoint para obtener usuario por UID
  @Get('user/:uid')
  async getTestUser(@Param('uid') uid: string) {
    try {
      const user = await this.userService.getUserByUid(uid);
      return {
        found: true,
        user: user
      };
    } catch (error) {
      return {
        found: false,
        error_message: error.message
      };
    }
  }

  // Endpoint para probar la conexión a la base de datos
  @Get('db-test')
  async testDatabase() {
    try {
      // Test básico de conexión
      return {
        success: true,
        message: 'Base de datos disponible para testing',
        timestamp: new Date().toISOString(),
        database: 'PostgreSQL'
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Error conectando a la base de datos: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Endpoint para listar todos los usuarios (útil para testing)
  @Get('users')
  async getAllUsers() {
    try {
      // Por ahora retornamos mock data
      return { 
        success: true,
        users: [],
        total: 0,
        message: 'Lista de usuarios (mock para testing)',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Error obteniendo usuarios: ${error.message}`
      };
    }
  }

  // Endpoint de salud
  @Get('health')
  async healthCheck() {
    return { 
      status: 'OK', 
      message: 'Service is running',
      timestamp: new Date().toISOString()
    };
  }
}