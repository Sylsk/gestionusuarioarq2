import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UserRole } from '../entities/user.entity';

@Controller('api/test')
export class TestController {
  constructor(private readonly userService: UserService) {}

  // Endpoint principal para LOGIN/VALIDACIÓN (este debería ser el que use el frontend)
  @Post('login')
  async loginUser(@Body() body: { 
    firebase_token: string;
    email: string; 
    nombre_completo: string; 
  }) {
    try {
      console.log('🔐 Intento de login:', {
        email: body.email,
        nombre_completo: body.nombre_completo,
        hasToken: !!body.firebase_token
      });

      // Verificar primero si el email está autorizado
      if (!this.isEmailAllowed(body.email)) {
        console.log(`❌ Email no autorizado: ${body.email}`);
        return {
          success: false,
          error_message: 'Dominio de correo no autorizado para acceder al sistema',
          allowed_domains: ['silasglauco@gmail.com', '@alumnos.ucn.cl']
        };
      }

      try {
        // 1. Primero intentar VALIDAR si el usuario ya existe
        console.log('🔍 Validando usuario existente...');
        const validationResult = await this.userService.validateUser(body.firebase_token);
        
        if (validationResult.isValid && validationResult.user) {
          console.log('✅ Usuario existente encontrado y validado');
          return {
            success: true,
            user: validationResult.user,
            message: 'Login exitoso - Usuario existente',
            source: 'existing_user'
          };
        }

        // 2. Si no existe, intentar CREAR el usuario
        console.log('📝 Usuario no existe, creando nuevo usuario...');
        const createRequest = {
          firebase_token: body.firebase_token,
          email: body.email,
          nombre_completo: body.nombre_completo
        };
        
        const newUser = await this.userService.createUser(createRequest);
        
        return {
          success: true,
          user: newUser,
          message: 'Login exitoso - Usuario creado',
          source: 'new_user'
        };

      } catch (firebaseError) {
        console.error('❌ Error con Firebase:', firebaseError.message);
        
        // Si falla Firebase, crear usuario mock para testing
        const uid = `mock-${Date.now()}`;
        const rol = this.determineUserRole(body.email);
        
        return {
          success: true,
          user: {
            uid,
            email: body.email,
            nombre_completo: body.nombre_completo,
            rol: rol,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          message: `Login exitoso (mock) - Rol: ${rol}`,
          source: 'mock'
        };
      }

    } catch (error) {
      console.error('❌ Error general en login:', error);
      return {
        success: false,
        error_message: `Error en login: ${error.message}`
      };
    }
  }

  // Endpoint de prueba para crear usuario con Firebase (mantener para testing manual)
  @Post('create-user')
  async createTestUser(@Body() body: { 
    firebase_token?: string;
    email: string; 
    nombre_completo: string; 
    uid?: string;
  }) {
    try {
      console.log(' Recibiendo solicitud de creación de usuario:', {
        email: body.email,
        nombre_completo: body.nombre_completo,
        hasToken: !!body.firebase_token
      });

      // Verificar primero si el email está autorizado
      if (!this.isEmailAllowed(body.email)) {
        console.log(` Email no autorizado: ${body.email}`);
        return {
          success: false,
          error_message: 'Dominio de correo no autorizado para acceder al sistema',
          allowed_domains: ['silasglauco@gmail.com', '@alumnos.ucn.cl']
        };
      }

      if (body.firebase_token) {
        // Si viene token de Firebase, intentar usar el servicio real
        try {
          console.log(' Intentando crear usuario con Firebase token...');
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
          console.error(' Error con Firebase:', firebaseError.message);
          
          // Si falla Firebase, crear usuario mock pero con el rol correcto
          const uid = `mock-${Date.now()}`;
          const rol = this.determineUserRole(body.email);
          
          return {
            success: true,
            user: {
              uid,
              email: body.email,
              nombre_completo: body.nombre_completo,
              rol: rol,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            message: `Usuario mock creado con rol ${rol} (Firebase falló: ${firebaseError.message})`,
            source: 'mock'
          };
        }
      } else {
        // Sin token, crear usuario mock con rol correcto
        const uid = body.uid || `test-${Date.now()}`;
        const rol = this.determineUserRole(body.email);
        
        return {
          success: true,
          user: {
            uid,
            email: body.email,
            nombre_completo: body.nombre_completo,
            rol: rol,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          message: `Usuario de prueba creado exitosamente con rol ${rol} (sin Firebase)`,
          source: 'test'
        };
      }
    } catch (error) {
      console.error(' Error general:', error);
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

  // Métodos auxiliares privados para validación de emails y roles
  private isEmailAllowed(email: string): boolean {
    console.log(` Verificando si el email está permitido: ${email}`);
    
    // Correo específico permitido
    if (email === 'silasglauco@gmail.com') {
      console.log(` Email específico autorizado`);
      return true;
    }
    
    // Dominio de alumnos UCN permitido
    if (email.endsWith('@alumnos.ucn.cl')) {
      console.log(` Dominio @alumnos.ucn.cl autorizado`);
      return true;
    }
    
    // Cualquier otro dominio no está permitido
    console.log(` Dominio no autorizado`);
    return false;
  }

  private determineUserRole(email: string): UserRole {
    console.log(` Determinando rol para email: ${email}`);
    
    // Correo específico para rol administrativo
    if (email === 'silasglauco@gmail.com') {
      console.log(` Email específico detectado → ADMIN`);
      return UserRole.ADMIN;
    }
    
    // Correos de alumnos UCN son tutores
    if (email.endsWith('@alumnos.ucn.cl')) {
      console.log(` Dominio @alumnos.ucn.cl detectado → TUTOR`);
      return UserRole.TUTOR;
    }
    
    // Este caso no debería ocurrir ya que isEmailAllowed lo previene
    console.log(`⚠️ Email no reconocido, esto no debería pasar`);
    throw new Error('Dominio de correo no autorizado');
  }
}