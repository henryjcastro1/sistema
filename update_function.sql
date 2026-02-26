DROP FUNCTION IF EXISTS create_user(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);

CREATE OR REPLACE FUNCTION create_user(
    p_nombre VARCHAR,
    p_apellido VARCHAR,
    p_email VARCHAR,
    p_password TEXT,
    p_telefono VARCHAR DEFAULT NULL,
    p_rol_nombre VARCHAR DEFAULT 'CLIENTE',
    p_foto_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    salt TEXT;
    hash TEXT;
    rol_id UUID;
BEGIN
    -- Generar salt como TEXT
    salt := gen_salt('bf');
    -- Generar hash como TEXT
    hash := crypt(p_password, salt);
    
    SELECT id INTO rol_id FROM roles WHERE nombre = p_rol_nombre;
    
    INSERT INTO usuarios (
        rol_id, 
        nombre, 
        apellido, 
        email, 
        telefono,
        password_hash, 
        password_salt,
        foto_url
    ) VALUES (
        rol_id, 
        p_nombre, 
        p_apellido, 
        p_email, 
        p_telefono,
        hash::BYTEA, 
        salt::BYTEA,
        p_foto_url
    ) RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;