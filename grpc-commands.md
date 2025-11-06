# Comandos gRPC con grpcurl

# 1. Listar servicios disponibles
grpcurl -plaintext localhost:50051 list

# 2. Describir el servicio UserService
grpcurl -plaintext localhost:50051 describe user_management.UserService

# 3. Crear un usuario (con token real de Firebase)
grpcurl -plaintext -d '{
  "firebase_token": "TU_TOKEN_FIREBASE_AQUI",
  "email": "test@example.com",
  "nombre_completo": "Usuario de Prueba"
}' localhost:50051 user_management.UserService/CreateUser

# 4. Obtener usuario por UID
grpcurl -plaintext -d '{
  "uid": "UID_DEL_USUARIO"
}' localhost:50051 user_management.UserService/GetUserByUid

# 5. Validar usuario
grpcurl -plaintext -d '{
  "firebase_token": "TU_TOKEN_FIREBASE_AQUI"
}' localhost:50051 user_management.UserService/ValidateUser

# 6. Actualizar rol de usuario
grpcurl -plaintext -d '{
  "uid": "UID_DEL_USUARIO",
  "new_role": "admin"
}' localhost:50051 user_management.UserService/UpdateUserRole

# 7. Eliminar usuario
grpcurl -plaintext -d '{
  "uid": "UID_DEL_USUARIO"
}' localhost:50051 user_management.UserService/DeleteUser