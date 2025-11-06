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
      console.log('🔍 UserService validateUser called with token length:', token?.length);
      
      const decodedToken = await this.firebaseService.verifyToken(token);
      console.log('✅ Token decoded successfully, UID:', decodedToken.uid);
      
      const user = await this.userRepository.findOne({ where: { uid: decodedToken.uid } });
      console.log('🔍 User lookup result:', user ? 'Found' : 'Not found');
      
      if (!user) {
        return {
          isValid: false,
          error: 'Usuario no encontrado en la base de datos local'
        };
      }

      return {
        isValid: true,
        user
      };
    } catch (error) {
      console.error('❌ ValidateUser error:', error.message);
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

      // Determinar el rol basado en el email
      const role = this.determineUserRole(createUserDto.email);

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

  private determineUserRole(email: string): UserRole {
    if (email === 'silasglauco@gmail.com') {
      return UserRole.ADMIN;
    }
    
    if (email.endsWith('@alumnos.ucn.cl')) {
      return UserRole.TUTOR;
    }
    
    // Por defecto, asignar rol de tutor si no cumple las condiciones específicas
    return UserRole.TUTOR;
  }
}