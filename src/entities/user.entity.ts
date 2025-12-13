import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  TUTOR = 'Tutor',
  ADMIN = 'Admin',
  TRABAJADOR = 'Trabajador'
}

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  uid: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TUTOR
  })
  rol: UserRole;

  @Column({ type: 'varchar', length: 255 })
  nombre_completo: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}