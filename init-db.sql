-- Crear la tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'Tutor' CHECK (rol IN ('Tutor', 'Admin')),
    nombre_completo VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);

-- Comentarios en las columnas para documentación
COMMENT ON COLUMN users.uid IS 'ID único proporcionado por Firebase (inmutable)';
COMMENT ON COLUMN users.email IS 'Correo electrónico del usuario';
COMMENT ON COLUMN users.rol IS 'Rol de negocio: Tutor o Admin';
COMMENT ON COLUMN users.nombre_completo IS 'Nombre completo del usuario';