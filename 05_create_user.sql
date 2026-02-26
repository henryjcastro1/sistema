-- Activar extensión pgcrypto (si no está activada)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear usuario gato2@demo.com si no existe
INSERT INTO usuarios (
    rol_id,
    nombre,
    apellido,
    email,
    password_hash,
    password_salt,
    email_verificado
)
SELECT 
    r.id,
    'Gato',
    'Admin',
    'gato2@demo.com',
    crypt('gato1234', gen_salt('bf'))::BYTEA,
    gen_salt('bf')::BYTEA,
    true
FROM roles r
WHERE r.nombre = 'ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'gato2@demo.com'
)
RETURNING id, email, nombre, apellido;

-- Mostrar mensaje de confirmación
DO $$
BEGIN
    IF FOUND THEN
        RAISE NOTICE '✅ Usuario gato2@demo.com creado exitosamente';
    ELSE
        RAISE NOTICE '⚠️ El usuario gato2@demo.com ya existe';
    END IF;
END;
$$;