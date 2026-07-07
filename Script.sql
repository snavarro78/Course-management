-- =====================================
-- TABLAS DE CATÁLOGO
-- =====================================

CREATE TABLE estratos (
    id_estrato SERIAL PRIMARY KEY,
    nombre_estrato VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE clases_puesto (
    id_clase_puesto SERIAL PRIMARY KEY,
    nombre_clase VARCHAR(100) NOT NULL UNIQUE
);

-- =====================================
-- PERSONAS
-- =====================================

CREATE TABLE personas (
    id_persona SERIAL PRIMARY KEY,
    cedula VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    contra VARCHAR(255) NOT NULL,

    rol VARCHAR(20) NOT NULL DEFAULT 'usuario'
        CHECK (rol IN ('usuario','admin','sub_admin','mediador')),

    direccion_regional_oficina VARCHAR(150),
    sexo VARCHAR(30),

    id_estrato INT,
    id_clase_puesto INT,

    CONSTRAINT fk_persona_estrato
        FOREIGN KEY (id_estrato)
        REFERENCES estratos(id_estrato),

    CONSTRAINT fk_persona_clase
        FOREIGN KEY (id_clase_puesto)
        REFERENCES clases_puesto(id_clase_puesto)
);

-- =====================================
-- CURSOS
-- =====================================

CREATE TABLE cursos (
    id_curso SERIAL PRIMARY KEY,

    consecutivo VARCHAR(50) NOT NULL,

    nombre_curso VARCHAR(200) NOT NULL,

    fecha_inicio DATE,

    fecha_fin DATE,

    CONSTRAINT chk_fechas
        CHECK (
            fecha_fin IS NULL
            OR fecha_inicio IS NULL
            OR fecha_fin >= fecha_inicio
        )
);

-- =====================================
-- MATRICULAS
-- =====================================

CREATE TABLE matriculas (

    id_matricula SERIAL PRIMARY KEY,

    id_persona INT NOT NULL,

    id_curso INT NOT NULL,

    estado VARCHAR(30)
        CHECK (estado IN ('aprobado','desaprobado')),

    CONSTRAINT fk_matricula_persona
        FOREIGN KEY(id_persona)
        REFERENCES personas(id_persona)
        ON DELETE CASCADE,

    CONSTRAINT fk_matricula_curso
        FOREIGN KEY(id_curso)
        REFERENCES cursos(id_curso)
        ON DELETE CASCADE,

    CONSTRAINT uq_matricula
        UNIQUE(id_persona,id_curso)
);

-- =====================================
-- CURSO_MEDIADORES
-- =====================================

CREATE TABLE curso_mediadores (

    id_curso_mediador SERIAL PRIMARY KEY,

    id_curso INT NOT NULL,

    id_persona INT NOT NULL,

    CONSTRAINT fk_cm_curso
        FOREIGN KEY(id_curso)
        REFERENCES cursos(id_curso)
        ON DELETE CASCADE,

    CONSTRAINT fk_cm_persona
        FOREIGN KEY(id_persona)
        REFERENCES personas(id_persona)
        ON DELETE CASCADE,

    CONSTRAINT uq_mediador
        UNIQUE(id_curso,id_persona)
);

-- =====================================
-- ÍNDICES
-- =====================================

CREATE INDEX idx_persona_cedula
ON personas(cedula);

CREATE INDEX idx_persona_email
ON personas(email);

CREATE INDEX idx_matricula_persona
ON matriculas(id_persona);

CREATE INDEX idx_matricula_curso
ON matriculas(id_curso);

CREATE INDEX idx_cm_persona
ON curso_mediadores(id_persona);

CREATE INDEX idx_cm_curso
ON curso_mediadores(id_curso);