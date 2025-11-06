# User Management Service

Microservicio de gestión de usuarios construido con NestJS que maneja autenticación con Firebase y autorización basada en roles.

## 🚀 Características

- **Autenticación Delegada**: Utiliza Firebase Authentication (Google Sign-In)
- **Autorización de Negocio**: Maneja roles Tutor y Admin
- **Comunicación gRPC**: Protocolo de comunicación eficiente
- **Base de Datos**: PostgreSQL con TypeORM
- **Containerización**: Docker y Docker Compose
- **Arquitectura de Microservicios**: Separación clara de responsabilidades

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│ User Management  │───▶│   PostgreSQL    │
│   (GraphQL)     │    │   Service (gRPC) │    │   (Docker)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Firebase Auth   │
                       └─────────────────┘
```

## 📋 Modelo de Datos

### Tabla: users

| Campo | Tipo | Notas |
|-------|------|-------|
| uid | VARCHAR | Clave Primaria. ID único de Firebase (inmutable) |
| email | VARCHAR | Correo electrónico del usuario |
| rol | VARCHAR | Rol de negocio: 'Tutor' o 'Admin' |
| nombre_completo | VARCHAR | Nombre completo del usuario |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de última actualización |

## 🔐 Lógica de Roles

- **Admin**: `silasglauco@gmail.com`
- **Tutor**: Emails que terminan en `@alumnos.ucn.cl`
- **Default**: Tutor (para casos no especificados)

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+ 
- Docker y Docker Compose
- Firebase Project configurado

### 1. Clonar e instalar dependencias

```bash
cd user-management-service
npm install
```

### 2. Configurar variables de entorno

Copia `.env` y configura tus credenciales de Firebase:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user_service
DB_PASSWORD=password123
DB_NAME=user_management

# gRPC Configuration
GRPC_URL=0.0.0.0:50051

# Firebase Configuration
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=tu-service-account@tu-proyecto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=tu-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

### 3. Levantar la base de datos

```bash
docker-compose up -d postgres
```

### 4. Ejecutar el microservicio

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

## 🐳 Docker

### Ejecutar con Docker Compose

```bash
# Levantar todo el stack (DB + PgAdmin)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Acceso a servicios

- **PostgreSQL**: `localhost:5432`
- **PgAdmin**: `http://localhost:8080` (admin@admin.com / admin123)
- **gRPC Service**: `localhost:50051`

## 🔌 API gRPC

### Servicios disponibles

#### 1. ValidateUser
Valida un token de Firebase y retorna la información del usuario.

```proto
rpc ValidateUser(ValidateUserRequest) returns (ValidateUserResponse);
```

#### 2. CreateUser
Crea un nuevo usuario en la base de datos local.

```proto
rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
```

#### 3. GetUserByUid
Obtiene un usuario por su UID de Firebase.

```proto
rpc GetUserByUid(GetUserByUidRequest) returns (GetUserResponse);
```

#### 4. UpdateUserRole
Actualiza el rol de un usuario.

```proto
rpc UpdateUserRole(UpdateUserRoleRequest) returns (UpdateUserRoleResponse);
```

#### 5. DeleteUser
Elimina un usuario de la base de datos.

```proto
rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
```

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## 📝 Scripts disponibles

```bash
npm run build          # Construir la aplicación
npm run start:dev      # Modo desarrollo con watch
npm run start:prod     # Modo producción
npm run lint           # Linter
npm run format         # Formateo de código
```

## 🔒 Seguridad

- Validación de tokens Firebase en cada request
- Separación de roles a nivel de base de datos
- Variables de entorno para credenciales sensibles
- Usuario no-root en contenedor Docker

## 🤝 Integración con API Gateway

Este microservicio está diseñado para ser consumido por un API Gateway que:

1. Recibe requests GraphQL del frontend
2. Se comunica con este microservicio vía gRPC
3. Maneja la orchestración de múltiples microservicios

## 📚 Tecnologías

- **Framework**: NestJS
- **Base de Datos**: PostgreSQL + TypeORM  
- **Autenticación**: Firebase Admin SDK
- **Comunicación**: gRPC
- **Containerización**: Docker
- **Validación**: class-validator
- **Configuración**: @nestjs/config

## 🐛 Troubleshooting

### Problemas comunes

1. **Error de conexión a PostgreSQL**: Verificar que Docker esté ejecutándose
2. **Token Firebase inválido**: Revisar configuración de credenciales
3. **Puerto 50051 ocupado**: Cambiar GRPC_URL en .env

### Logs útiles

```bash
# Ver logs del microservicio
docker-compose logs -f

# Ver logs solo de PostgreSQL
docker-compose logs postgres
```

## 📄 Licencia

MIT