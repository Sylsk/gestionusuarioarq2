import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  firebase_token: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  nombre_completo: string;
}

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsString()
  uid: string;

  @IsEnum(UserRole)
  new_role: UserRole;
}

export class ValidateUserDto {
  @IsNotEmpty()
  @IsString()
  firebase_token: string;
}