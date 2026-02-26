-- =====================================================
-- EXTENSIONES NECESARIAS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- DOMINIOS (Reemplazo de ENUMS para escalabilidad)
-- =====================================================
CREATE TABLE dominios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_dominio VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tipo_dominio, codigo)
);

-- Insertar dominios iniciales
INSERT INTO dominios (tipo_dominio, codigo, nombre, orden) VALUES
    -- Estados de servicio
    ('estado_servicio', 'SOLICITADO', 'Solicitado', 1),
    ('estado_servicio', 'EN_PROCESO', 'En Proceso', 2),
    ('estado_servicio', 'COMPLETADO', 'Completado', 3),
    ('estado_servicio', 'CANCELADO', 'Cancelado', 4),
    
    -- Estados de pedido
    ('estado_pedido', 'PENDIENTE', 'Pendiente', 1),
    ('estado_pedido', 'PAGADO', 'Pagado', 2),
    ('estado_pedido', 'ENVIADO', 'Enviado', 3),
    ('estado_pedido', 'ENTREGADO', 'Entregado', 4),
    ('estado_pedido', 'CANCELADO', 'Cancelado', 5),
    
    -- Tipos de mensaje
    ('tipo_mensaje', 'TEXTO', 'Texto', 1),
    ('tipo_mensaje', 'IMAGEN', 'Imagen', 2),
    ('tipo_mensaje', 'AUDIO', 'Audio', 3),
    ('tipo_mensaje', 'DOCUMENTO', 'Documento', 4),
    ('tipo_mensaje', 'UBICACION', 'Ubicación', 5),
    
    -- Tipos de item en pedidos
    ('tipo_item', 'PRODUCTO', 'Producto', 1),
    ('tipo_item', 'SERVICIO', 'Servicio', 2);

-- =====================================================
-- ROLES
-- =====================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    nivel INT CHECK (nivel BETWEEN 1 AND 5),
    es_por_defecto BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Insertar roles base
INSERT INTO roles (nombre, descripcion, nivel, es_por_defecto) VALUES
    ('SUPERADMIN', 'Acceso total al sistema', 1, false),
    ('ADMIN', 'Administrador con permisos completos', 2, false),
    ('SUPERVISOR', 'Supervisor de operaciones', 3, false),
    ('TECNICO', 'Técnico que ejecuta servicios', 4, true),
    ('CLIENTE', 'Usuario cliente regular', 5, true);

-- =====================================================
-- MÓDULOS Y PERMISOS (RBAC)
-- =====================================================
CREATE TABLE modulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    icono VARCHAR(50),
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar módulos base
INSERT INTO modulos (nombre, codigo, orden) VALUES
    ('Dashboard', 'dashboard', 1),
    ('Servicios', 'servicios', 2),
    ('Usuarios', 'usuarios', 3),
    ('Productos', 'productos', 4),
    ('Pedidos', 'pedidos', 5),
    ('Pagos', 'pagos', 6),
    ('Reportes', 'reportes', 7),
    ('Configuración', 'configuracion', 8),
    ('Chat', 'chat', 9),
    ('SLA', 'sla', 10);

CREATE TABLE permisos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modulo_id UUID REFERENCES modulos(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    UNIQUE(modulo_id, codigo)
);

-- Insertar permisos base
DO $$
DECLARE
    mod_record RECORD;
BEGIN
    FOR mod_record IN SELECT * FROM modulos LOOP
        INSERT INTO permisos (modulo_id, codigo, nombre) VALUES
            (mod_record.id, 'ver', 'Ver ' || mod_record.nombre),
            (mod_record.id, 'crear', 'Crear ' || mod_record.nombre),
            (mod_record.id, 'editar', 'Editar ' || mod_record.nombre),
            (mod_record.id, 'eliminar', 'Eliminar ' || mod_record.nombre);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE role_permisos (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id UUID REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permiso_id)
);

-- Asignar permisos básicos a roles por defecto
INSERT INTO role_permisos (role_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
WHERE r.nombre = 'ADMIN';

INSERT INTO role_permisos (role_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
JOIN modulos m ON p.modulo_id = m.id
WHERE r.nombre = 'TECNICO' 
  AND m.codigo IN ('servicios', 'chat', 'sla')
  AND p.codigo IN ('ver', 'editar');

INSERT INTO role_permisos (role_id, permiso_id)
SELECT r.id, p.id
FROM roles r, permisos p
JOIN modulos m ON p.modulo_id = m.id
WHERE r.nombre = 'CLIENTE' 
  AND m.codigo IN ('servicios', 'chat')
  AND p.codigo = 'ver';

-- =====================================================
-- USUARIOS (VERSIÓN CORREGIDA)
-- =====================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_id UUID REFERENCES roles(id),
    
    -- Datos personales
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(50),
    
    -- Autenticación (usando pgcrypto)
    password_hash BYTEA NOT NULL,
    password_salt BYTEA NOT NULL,
    
    -- Perfil
    foto_url TEXT,
    
    -- Verificación email
    email_verificado BOOLEAN DEFAULT FALSE,
    token_verificacion TEXT,
    token_expiracion TIMESTAMP,
    
    -- Seguridad
    intentos_fallidos INT DEFAULT 0,
    bloqueado BOOLEAN DEFAULT FALSE,
    ultimo_login TIMESTAMP,
    ultimo_ip INET,
    
    -- 2FA
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    
    -- Preferencias
    preferencias JSONB DEFAULT '{}'::jsonb,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    CONSTRAINT unique_email UNIQUE (email)
);

-- Índice parcial para emails activos
CREATE UNIQUE INDEX idx_unique_active_email ON usuarios(email) WHERE deleted_at IS NULL;

-- Índices para búsquedas frecuentes
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_usuarios_nombre_completo ON usuarios(nombre, apellido) WHERE deleted_at IS NULL;

-- =====================================================
-- FUNCIÓN PARA VERIFICAR PASSWORD
-- =====================================================
CREATE OR REPLACE FUNCTION verify_password(
    input_password TEXT,
    stored_hash BYTEA,
    stored_salt BYTEA
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN stored_hash = crypt(input_password, encode(stored_salt, 'escape'))::BYTEA;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN PARA CREAR USUARIO CON PASSWORD SEGURO (CORREGIDA)
-- =====================================================
CREATE OR REPLACE FUNCTION create_user(
    p_nombre VARCHAR,
    p_apellido VARCHAR,
    p_email VARCHAR,
    p_password TEXT,
    p_telefono VARCHAR DEFAULT NULL,
    p_rol_nombre VARCHAR DEFAULT 'CLIENTE'
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
        rol_id, nombre, apellido, email, telefono,
        password_hash, password_salt
    ) VALUES (
        rol_id, p_nombre, p_apellido, p_email, p_telefono,
        hash::BYTEA, salt::BYTEA
    ) RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DIRECCIONES
-- =====================================================
CREATE TABLE direcciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    alias VARCHAR(50) DEFAULT 'Principal',
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Argentina',
    codigo_postal VARCHAR(20),
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_direcciones_usuario ON direcciones(usuario_id) WHERE deleted_at IS NULL;

-- =====================================================
-- PRODUCTOS
-- =====================================================
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(14,2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_productos_activo ON productos(activo) WHERE deleted_at IS NULL;

-- =====================================================
-- SLA ENGINE
-- =====================================================
CREATE TABLE sla_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    prioridad INT NOT NULL CHECK (prioridad BETWEEN 1 AND 5),
    tiempo_respuesta_minutos INT NOT NULL,
    tiempo_solucion_minutos INT NOT NULL,
    horario_inicio TIME DEFAULT '09:00',
    horario_fin TIME DEFAULT '18:00',
    dias_habiles INT[] DEFAULT '{1,2,3,4,5}',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

INSERT INTO sla_config (nombre, prioridad, tiempo_respuesta_minutos, tiempo_solucion_minutos) VALUES
    ('SLA Crítico', 1, 15, 60),
    ('SLA Alta', 2, 30, 120),
    ('SLA Media', 3, 60, 240),
    ('SLA Baja', 4, 120, 480),
    ('SLA Muy Baja', 5, 240, 960);

-- =====================================================
-- SERVICIOS
-- =====================================================
CREATE SEQUENCE seq_servicio START 1;

CREATE TABLE servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_servicio VARCHAR(50) UNIQUE,
    
    -- Relaciones
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    tecnico_id UUID REFERENCES usuarios(id),
    sla_config_id UUID REFERENCES sla_config(id),
    
    -- Detalles
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'SOLICITADO',
    direccion TEXT,
    prioridad INT DEFAULT 3 CHECK (prioridad BETWEEN 1 AND 5),
    
    -- Económico
    presupuesto NUMERIC(14,2),
    costo_final NUMERIC(14,2),
    
    -- Fechas clave
    fecha_solicitado TIMESTAMP DEFAULT NOW(),
    fecha_asignado TIMESTAMP,
    fecha_inicio TIMESTAMP,
    fecha_primera_respuesta TIMESTAMP,
    fecha_completado TIMESTAMP,
    fecha_cancelado TIMESTAMP,
    
    -- SLA deadlines
    sla_deadline_respuesta TIMESTAMP,
    sla_deadline_solucion TIMESTAMP,
    sla_cumple_respuesta BOOLEAN,
    sla_cumple_solucion BOOLEAN,
    
    -- Evaluación
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5),
    comentario_cliente TEXT,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Índices
CREATE INDEX idx_servicios_usuario ON servicios(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_servicios_tecnico ON servicios(tecnico_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_servicios_estado ON servicios(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_servicios_prioridad ON servicios(prioridad) WHERE deleted_at IS NULL;
CREATE INDEX idx_servicios_fechas ON servicios(fecha_solicitado, fecha_asignado) WHERE deleted_at IS NULL;
CREATE INDEX idx_servicios_estado_tecnico ON servicios(estado, tecnico_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_servicios_usuario_created ON servicios(usuario_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_servicios_tecnico_estado ON servicios(tecnico_id, estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_servicios_sla_cumplimiento ON servicios(sla_cumple_respuesta, sla_cumple_solucion) WHERE deleted_at IS NULL;

-- Función para generar número de servicio
CREATE OR REPLACE FUNCTION generar_numero_servicio()
RETURNS TRIGGER AS $$
DECLARE
    seq_num TEXT;
    fecha_prefix TEXT;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('servicio_seq_lock'));
    fecha_prefix := TO_CHAR(NOW(), 'YYMM');
    seq_num := LPAD(nextval('seq_servicio')::TEXT, 6, '0');
    NEW.numero_servicio := 'S-' || fecha_prefix || '-' || seq_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_servicio_numero
BEFORE INSERT ON servicios
FOR EACH ROW
EXECUTE FUNCTION generar_numero_servicio();

-- Función para calcular deadlines SLA
CREATE OR REPLACE FUNCTION calcular_sla_deadlines()
RETURNS TRIGGER AS $$
DECLARE
    sla sla_config%ROWTYPE;
BEGIN
    IF NEW.sla_config_id IS NOT NULL THEN
        SELECT * INTO sla FROM sla_config WHERE id = NEW.sla_config_id;
        NEW.sla_deadline_respuesta := NEW.fecha_solicitado + (sla.tiempo_respuesta_minutos || ' minutes')::INTERVAL;
        NEW.sla_deadline_solucion := NEW.fecha_solicitado + (sla.tiempo_solucion_minutos || ' minutes')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_servicio_sla
BEFORE INSERT ON servicios
FOR EACH ROW
EXECUTE FUNCTION calcular_sla_deadlines();

-- Función para verificar cumplimiento SLA
CREATE OR REPLACE FUNCTION verificar_cumplimiento_sla()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_primera_respuesta IS NOT NULL AND NEW.sla_deadline_respuesta IS NOT NULL THEN
        NEW.sla_cumple_respuesta := NEW.fecha_primera_respuesta <= NEW.sla_deadline_respuesta;
    END IF;
    IF NEW.fecha_completado IS NOT NULL AND NEW.sla_deadline_solucion IS NOT NULL THEN
        NEW.sla_cumple_solucion := NEW.fecha_completado <= NEW.sla_deadline_solucion;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_servicio_sla_verificar
BEFORE UPDATE OF fecha_primera_respuesta, fecha_completado ON servicios
FOR EACH ROW
EXECUTE FUNCTION verificar_cumplimiento_sla();

-- =====================================================
-- PEDIDOS
-- =====================================================
CREATE SEQUENCE seq_pedido START 1;

CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido VARCHAR(50) UNIQUE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    cliente_nombre VARCHAR(200),
    cliente_email VARCHAR(150),
    cliente_direccion TEXT,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    subtotal NUMERIC(14,2) DEFAULT 0,
    impuesto NUMERIC(14,2) DEFAULT 0,
    descuento NUMERIC(14,2) DEFAULT 0,
    costo_envio NUMERIC(14,2) DEFAULT 0,
    total_final NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_estado ON pedidos(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedidos_usuario_created ON pedidos(usuario_id, created_at DESC) WHERE deleted_at IS NULL;

-- Función para generar número de pedido
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('pedido_seq_lock'));
    NEW.numero_pedido := 'P-' || TO_CHAR(NOW(), 'YYMM') || '-' || LPAD(nextval('seq_pedido')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pedido_numero
BEFORE INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION generar_numero_pedido();

-- =====================================================
-- ITEMS DE PEDIDOS (CORREGIDO - SIN CHECK CONSTRAINT PROBLEMÁTICA)
-- =====================================================
CREATE TABLE items_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    tipo_item VARCHAR(20) NOT NULL CHECK (tipo_item IN ('PRODUCTO', 'SERVICIO')),
    item_id UUID NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(14,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_items_pedido ON items_pedido(pedido_id);
CREATE INDEX idx_items_tipo_referencia ON items_pedido(tipo_item, item_id);

-- Trigger para validar referencias (reemplaza el CHECK constraint)
CREATE OR REPLACE FUNCTION validate_item_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo_item = 'PRODUCTO' THEN
        IF NOT EXISTS (SELECT 1 FROM productos WHERE id = NEW.item_id AND deleted_at IS NULL) THEN
            RAISE EXCEPTION 'Producto no existe o está eliminado: %', NEW.item_id;
        END IF;
    ELSIF NEW.tipo_item = 'SERVICIO' THEN
        IF NOT EXISTS (SELECT 1 FROM servicios WHERE id = NEW.item_id AND deleted_at IS NULL) THEN
            RAISE EXCEPTION 'Servicio no existe o está eliminado: %', NEW.item_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'Tipo de item inválido: %', NEW.tipo_item;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_items_pedido_validate
BEFORE INSERT OR UPDATE ON items_pedido
FOR EACH ROW
EXECUTE FUNCTION validate_item_reference();

-- =====================================================
-- CHAT Y MENSAJES
-- =====================================================
CREATE TABLE conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) DEFAULT 'servicio',
    referencia_id UUID,
    ultimo_mensaje_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_conversaciones_referencia ON conversaciones(referencia_id) WHERE deleted_at IS NULL;

CREATE TABLE participantes_conversacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensajes_no_leidos INT DEFAULT 0,
    ultima_lectura TIMESTAMP DEFAULT NOW(),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(conversacion_id, usuario_id)
);

CREATE INDEX idx_participantes_usuario ON participantes_conversacion(usuario_id);

CREATE TABLE mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    contenido TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'TEXTO',
    metadata JSONB DEFAULT '{}'::jsonb,
    leido BOOLEAN DEFAULT FALSE,
    fecha_lectura TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mensajes_conversacion ON mensajes(conversacion_id, created_at);

-- =====================================================
-- NOTIFICACIONES
-- =====================================================
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50),
    data JSONB DEFAULT '{}'::jsonb,
    leida BOOLEAN DEFAULT FALSE,
    fecha_lectura TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leida, created_at);

-- =====================================================
-- TRACKING GPS
-- =====================================================
CREATE TABLE tracking_tecnico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tecnico_id UUID NOT NULL REFERENCES usuarios(id),
    servicio_id UUID REFERENCES servicios(id),
    latitud DECIMAL(10,8) NOT NULL,
    longitud DECIMAL(11,8) NOT NULL,
    precision_metros DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tracking_tecnico ON tracking_tecnico(tecnico_id, created_at);
CREATE INDEX idx_tracking_servicio ON tracking_tecnico(servicio_id, created_at);

-- Vista para última ubicación conocida
CREATE VIEW v_ultima_ubicacion_tecnico AS
SELECT DISTINCT ON (tecnico_id) 
    tecnico_id,
    latitud,
    longitud,
    created_at as ultima_actualizacion
FROM tracking_tecnico
ORDER BY tecnico_id, created_at DESC;

-- =====================================================
-- CALIFICACIONES Y RESEÑAS
-- =====================================================
CREATE TABLE resenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id UUID NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    fotos TEXT[],
    respuesta TEXT,
    fecha_respuesta TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resenas_servicio ON resenas(servicio_id);

-- =====================================================
-- FAVORITOS
-- =====================================================
CREATE TABLE favoritos_tecnicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tecnico_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(cliente_id, tecnico_id)
);

CREATE INDEX idx_favoritos_cliente ON favoritos_tecnicos(cliente_id);

-- =====================================================
-- PAGOS Y TRANSACCIONES
-- =====================================================
CREATE TABLE metodos_pago_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    token_pago VARCHAR(255),
    ultimos_digitos VARCHAR(4),
    titular VARCHAR(100),
    fecha_expiracion DATE,
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_metodos_pago_usuario ON metodos_pago_usuario(usuario_id) WHERE deleted_at IS NULL;

CREATE TABLE transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    metodo_pago_id UUID REFERENCES metodos_pago_usuario(id),
    monto NUMERIC(14,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    referencia_externa VARCHAR(255),
    respuesta_completa JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transacciones_pedido ON transacciones(pedido_id);
CREATE INDEX idx_transacciones_usuario ON transacciones(usuario_id, created_at);

-- =====================================================
-- AUDITORÍA
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    accion VARCHAR(50) NOT NULL,
    tabla VARCHAR(100) NOT NULL,
    registro_id UUID,
    datos_antes JSONB,
    datos_despues JSONB,
    ip INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_usuario ON audit_logs(usuario_id);
CREATE INDEX idx_audit_tabla ON audit_logs(tabla, created_at);
CREATE INDEX idx_audit_fecha ON audit_logs(created_at);

-- =====================================================
-- CONFIGURACIÓN DE APP
-- =====================================================
CREATE TABLE configuracion_app (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo_dato VARCHAR(20) DEFAULT 'texto',
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO configuracion_app (clave, valor, tipo_dato, descripcion) VALUES
    ('app_version_android', '1.0.0', 'texto', 'Versión mínima de Android'),
    ('app_version_ios', '1.0.0', 'texto', 'Versión mínima de iOS'),
    ('tiempo_maximo_servicio_minutos', '120', 'numero', 'Tiempo máximo por defecto'),
    ('notificaciones_habilitadas', 'true', 'booleano', 'Notificaciones globales'),
    ('sla_activo', 'true', 'booleano', 'Habilitar cumplimiento de SLA');

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_servicios_updated BEFORE UPDATE ON servicios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_productos_updated BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_conversaciones_updated BEFORE UPDATE ON conversaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sla_config_updated BEFORE UPDATE ON sla_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VISTAS ÚTILES PARA DASHBOARDS
-- =====================================================

-- Vista de servicios activos con SLA
CREATE VIEW v_servicios_activos AS
SELECT 
    s.id,
    s.numero_servicio,
    s.titulo,
    s.estado,
    s.prioridad,
    s.fecha_solicitado,
    CONCAT(c.nombre, ' ', c.apellido) as cliente,
    c.telefono as cliente_telefono,
    CONCAT(t.nombre, ' ', t.apellido) as tecnico,
    s.sla_deadline_respuesta,
    s.sla_deadline_solucion,
    CASE 
        WHEN s.sla_deadline_respuesta < NOW() AND s.fecha_primera_respuesta IS NULL THEN '🔴 VENCIDO'
        WHEN s.sla_deadline_solucion < NOW() AND s.estado != 'COMPLETADO' THEN '🔴 VENCIDO'
        ELSE '🟢 EN PLAZO'
    END as estado_sla
FROM servicios s
JOIN usuarios c ON s.usuario_id = c.id
LEFT JOIN usuarios t ON s.tecnico_id = t.id
WHERE s.estado NOT IN ('COMPLETADO', 'CANCELADO')
  AND s.deleted_at IS NULL;

-- Vista de resumen de técnicos con métricas
CREATE VIEW v_resumen_tecnicos AS
SELECT 
    t.id,
    t.nombre || ' ' || t.apellido as nombre_completo,
    t.email,
    COUNT(s.id) FILTER (WHERE s.estado = 'EN_PROCESO') as servicios_activos,
    COUNT(s.id) FILTER (WHERE s.estado = 'COMPLETADO' AND s.fecha_completado > NOW() - INTERVAL '7 days') as servicios_semana,
    ROUND(AVG(s.calificacion) FILTER (WHERE s.calificacion IS NOT NULL), 1) as calificacion_promedio,
    ROUND(AVG(EXTRACT(EPOCH FROM (s.fecha_completado - s.fecha_asignado))/3600)::NUMERIC, 1) as horas_promedio,
    COUNT(s.id) FILTER (WHERE s.sla_cumple_solucion = false) as sla_incumplidos
FROM usuarios t
LEFT JOIN servicios s ON t.id = s.tecnico_id AND s.deleted_at IS NULL
WHERE t.rol_id = (SELECT id FROM roles WHERE nombre = 'TECNICO')
  AND t.deleted_at IS NULL
GROUP BY t.id, t.nombre, t.apellido, t.email;

-- Vista de cumplimiento SLA
CREATE VIEW v_cumplimiento_sla AS
SELECT 
    DATE_TRUNC('day', s.fecha_solicitado) as dia,
    s.prioridad,
    COUNT(*) as total_servicios,
    COUNT(*) FILTER (WHERE s.sla_cumple_respuesta = true) as cumple_respuesta,
    COUNT(*) FILTER (WHERE s.sla_cumple_solucion = true) as cumple_solucion,
    ROUND(COUNT(*) FILTER (WHERE s.sla_cumple_respuesta = true) * 100.0 / COUNT(*), 1) as porcentaje_cumple_respuesta,
    ROUND(COUNT(*) FILTER (WHERE s.sla_cumple_solucion = true) * 100.0 / COUNT(*), 1) as porcentaje_cumple_solucion
FROM servicios s
WHERE s.fecha_solicitado > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', s.fecha_solicitado), s.prioridad
ORDER BY dia DESC, s.prioridad;

-- =====================================================
-- FUNCIONES DE LIMPIEZA
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_tracking(dias_retener INT DEFAULT 30)
RETURNS void AS $$
BEGIN
    DELETE FROM tracking_tecnico 
    WHERE created_at < NOW() - (dias_retener || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_notificaciones(dias_retener INT DEFAULT 30)
RETURNS void AS $$
BEGIN
    DELETE FROM notificaciones 
    WHERE created_at < NOW() - (dias_retener || ' days')::INTERVAL
    AND leida = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS DE PRUEBA (CORREGIDOS)
-- =====================================================

-- Crear usuarios de prueba
SELECT create_user('Admin', 'Principal', 'admin@demo.com', 'Admin123', '+123456789', 'ADMIN');
SELECT create_user('Carlos', 'Gomez', 'carlos@demo.com', 'Tecnico123', '+234567890', 'TECNICO');
SELECT create_user('Ana', 'Lopez', 'ana@demo.com', 'Cliente123', '+345678901', 'CLIENTE');

-- Crear servicios de prueba con SLA
DO $$
DECLARE
    cliente_id UUID;
    tecnico_id UUID;
    sla_media UUID;
BEGIN
    -- Obtener IDs después de crear usuarios
    SELECT id INTO cliente_id FROM usuarios WHERE email = 'ana@demo.com';
    SELECT id INTO tecnico_id FROM usuarios WHERE email = 'carlos@demo.com';
    SELECT id INTO sla_media FROM sla_config WHERE prioridad = 3;
    
    -- Insertar servicios (sin fechas de respuesta para evitar nulls)
    INSERT INTO servicios (
        usuario_id, tecnico_id, sla_config_id, 
        titulo, descripcion, direccion, prioridad
    ) VALUES 
        (cliente_id, tecnico_id, sla_media, 'Reparación de PC', 
         'La computadora no enciende', 'Av. Siempre Viva 123', 2),
        (cliente_id, NULL, sla_media, 'Instalación de software', 
         'Necesito Office y antivirus', 'Av. Siempre Viva 123', 3);
END;
$$ LANGUAGE plpgsql;

-- Crear conversación de prueba
DO $$
DECLARE
    cliente_id UUID;
    tecnico_id UUID;
    conv_id UUID;
    servicio_id UUID;
BEGIN
    SELECT id INTO cliente_id FROM usuarios WHERE email = 'ana@demo.com';
    SELECT id INTO tecnico_id FROM usuarios WHERE email = 'carlos@demo.com';
    SELECT id INTO servicio_id FROM servicios LIMIT 1;
    
    INSERT INTO conversaciones (tipo, referencia_id) 
    VALUES ('servicio', servicio_id)
    RETURNING id INTO conv_id;
    
    INSERT INTO participantes_conversacion (conversacion_id, usuario_id) VALUES
        (conv_id, cliente_id),
        (conv_id, tecnico_id);
    
    INSERT INTO mensajes (conversacion_id, usuario_id, contenido) VALUES
        (conv_id, cliente_id, 'Hola, ¿cuándo puede venir?'),
        (conv_id, tecnico_id, 'Puedo ir mañana a las 10am'),
        (conv_id, cliente_id, 'Perfecto, te espero');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con autenticación segura usando pgcrypto';
COMMENT ON TABLE dominios IS 'Tabla de dominios dinámicos que reemplaza ENUMS para mayor flexibilidad';
COMMENT ON TABLE sla_config IS 'Configuración de SLA para servicios de helpdesk';
COMMENT ON TABLE servicios IS 'Servicios con tracking de SLA y cumplimiento';
COMMENT ON COLUMN servicios.sla_cumple_respuesta IS 'Indica si se cumplió el tiempo de respuesta del SLA';
COMMENT ON COLUMN servicios.sla_cumple_solucion IS 'Indica si se cumplió el tiempo de solución del SLA';
COMMENT ON TABLE items_pedido IS 'Items de pedidos con validación de integridad referencial';