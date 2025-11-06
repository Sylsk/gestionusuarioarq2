import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { FirebaseService } from './firebase.service';
import { CreateUserDto, UpdateUserRoleDto } from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async validateUser(token: string): Promise<{ isValid: boolean; user?: User; error?: string }> {
    try {
      console.log(' UserService validateUser called with token length:', token?.length);
      
      const decodedToken = await this.firebaseService.verifyToken(token);
      console.log(' Token decoded successfully, UID:', decodedToken.uid);
      
      // Buscar usuario existente
      let user = await this.userRepository.findOne({ where: { uid: decodedToken.uid } });
      console.log(' User lookup result:', user ? 'Found' : 'Not found');
      
      if (!user) {
        console.log(' Usuario no encontrado, creando automáticamente...');
        
        // Verificar que el token tenga email
        if (!decodedToken.email) {
          return {
            isValid: false,
            error: 'Token de Firebase no contiene información de email'
          };
        }
        
        // Verificar si el email está autorizado
        if (!this.isEmailAllowed(decodedToken.email)) {
          console.log(` Email ${decodedToken.email} no está autorizado`);
          return {
            isValid: false,
            error: 'Dominio de correo no autorizado para acceder al sistema'
          };
        }

        // Crear usuario automáticamente
        const role = this.determineUserRole(decodedToken.email);
        user = this.userRepository.create({
          uid: decodedToken.uid,
          email: decodedToken.email,
          rol: role,
          nombre_completo: decodedToken.name || decodedToken.email.split('@')[0],
        });

        user = await this.userRepository.save(user);
        console.log(` Usuario creado automáticamente con rol: ${role}`);
      }

      // Verificar si el email del usuario sigue siendo válido
      if (!this.isEmailAllowed(user.email)) {
        console.log(` Email ${user.email} ya no está autorizado`);
        return {
          isValid: false,
          error: 'Dominio de correo no autorizado para acceder al sistema'
        };
      }

      return {
        isValid: true,
        user
      };
    } catch (error) {
      console.error(' ValidateUser error:', error.message);
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const decodedToken = await this.firebaseService.verifyToken(createUserDto.firebase_token);
      
      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.findOne({ where: { uid: decodedToken.uid } });
      if (existingUser) {
        throw new BadRequestException('Usuario ya existe');
      }

      // Verificar si el dominio del email está permitido
      if (!this.isEmailAllowed(createUserDto.email)) {
        throw new BadRequestException('Dominio de correo no autorizado para acceder al sistema');
      }

      // Determinar el rol basado en el email
      const role = this.determineUserRole(createUserDto.email);
      console.log(` Email: ${createUserDto.email} → Rol asignado: ${role}`);

      const user = this.userRepository.create({
        uid: decodedToken.uid,
        email: createUserDto.email,
        rol: role,
        nombre_completo: createUserDto.nombre_completo,
      });

      return await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException(`Error creando usuario: ${error.message}`);
    }
  }

  async getUserByUid(uid: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { uid } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async updateUserRole(updateUserRoleDto: UpdateUserRoleDto): Promise<User> {
    const user = await this.getUserByUid(updateUserRoleDto.uid);
    user.rol = updateUserRoleDto.new_role;
    return await this.userRepository.save(user);
  }

  async deleteUser(uid: string): Promise<boolean> {
    const result = await this.userRepository.delete({ uid });
    return (result.affected ?? 0) > 0;
  }

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
    console.log(` Email no reconocido, esto no debería pasar`);
    throw new Error('Dominio de correo no autorizado');
  }
}