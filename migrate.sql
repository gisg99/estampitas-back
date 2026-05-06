-- Selecciones
CREATE TABLE IF NOT EXISTS selecciones (
  id         SERIAL PRIMARY KEY,
  nombre     TEXT NOT NULL,
  abreviatura TEXT NOT NULL UNIQUE
);

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id                   SERIAL PRIMARY KEY,
  nombre               TEXT NOT NULL,
  correo               TEXT NOT NULL UNIQUE,
  fecha_nacimiento     DATE,
  hashed_password      TEXT NOT NULL,
  pais                 TEXT,
  estado               TEXT,
  genero               TEXT,
  seleccion_favorita   INTEGER REFERENCES selecciones(id) ON DELETE SET NULL,
  jugador_favorito     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stickers (catálogo por selección)
-- tipo: 'jugador' | 'escudo' | 'alineacion'
-- posicion: null para escudo/alineacion, nombre del puesto para jugadores
CREATE TABLE IF NOT EXISTS stickers (
  id            SERIAL PRIMARY KEY,
  seleccion_id  INTEGER NOT NULL REFERENCES selecciones(id) ON DELETE CASCADE,
  numero        INTEGER NOT NULL,           -- 1-20 dentro de la selección
  tipo          TEXT NOT NULL CHECK (tipo IN ('jugador', 'escudo', 'alineacion')),
  posicion      TEXT,                       -- portero, defensa, mediocampista, delantero
  UNIQUE (seleccion_id, numero)
);

-- Colección de stickers por usuario
CREATE TABLE IF NOT EXISTS coleccion (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  sticker_id  INTEGER NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
  cantidad    INTEGER NOT NULL DEFAULT 1 CHECK (cantidad >= 0),
  UNIQUE (usuario_id, sticker_id)
);
