import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

const isLocal = !connectionString || /localhost|127\.0\.0\.1/.test(connectionString);

const pool = new pg.Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// CC: 14 cromos promocionales, numerados 1-14
const ccTemplate = Array.from({ length: 14 }, (_, i) => ({
  numero:   i + 1,
  tipo:     'jugador',
  posicion: null,
}));

// FWC: todas las 20 estampas son holográficas (escudo)
const fwcTemplate = Array.from({ length: 20 }, (_, i) => ({
  numero: i,
  tipo: 'escudo',
  posicion: null,
}));

// numero 1        → escudo
// numeros 2-4     → portero    (3)
// numeros 5-9     → defensa    (5)
// numeros 10-14   → mediocampista (5)
// numeros 15-19   → delantero  (5)
// numero 20       → alineacion
const stickerTemplate = [
  { numero: 1,  tipo: 'escudo',       posicion: null             },
  { numero: 2,  tipo: 'jugador',      posicion: 'portero'        },
  { numero: 3,  tipo: 'jugador',      posicion: 'portero'        },
  { numero: 4,  tipo: 'jugador',      posicion: 'portero'        },
  { numero: 5,  tipo: 'jugador',      posicion: 'defensa'        },
  { numero: 6,  tipo: 'jugador',      posicion: 'defensa'        },
  { numero: 7,  tipo: 'jugador',      posicion: 'defensa'        },
  { numero: 8,  tipo: 'jugador',      posicion: 'defensa'        },
  { numero: 9,  tipo: 'jugador',      posicion: 'defensa'        },
  { numero: 10, tipo: 'jugador',      posicion: 'mediocampista'  },
  { numero: 11, tipo: 'jugador',      posicion: 'mediocampista'  },
  { numero: 12, tipo: 'jugador',      posicion: 'mediocampista'  },
  { numero: 13, tipo: 'jugador',      posicion: 'mediocampista'  },
  { numero: 14, tipo: 'jugador',      posicion: 'mediocampista'  },
  { numero: 15, tipo: 'jugador',      posicion: 'delantero'      },
  { numero: 16, tipo: 'jugador',      posicion: 'delantero'      },
  { numero: 17, tipo: 'jugador',      posicion: 'delantero'      },
  { numero: 18, tipo: 'jugador',      posicion: 'delantero'      },
  { numero: 19, tipo: 'jugador',      posicion: 'delantero'      },
  { numero: 20, tipo: 'alineacion',   posicion: null             },
];

export async function initDB() {
  const client = await pool.connect();
  try {
    // 1. Crear tablas
    await client.query(`
      CREATE TABLE IF NOT EXISTS selecciones (
        id          SERIAL PRIMARY KEY,
        nombre      TEXT NOT NULL,
        abreviatura TEXT NOT NULL UNIQUE,
        grupo       TEXT
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id                 SERIAL PRIMARY KEY,
        nombre             TEXT NOT NULL,
        correo             TEXT NOT NULL UNIQUE,
        fecha_nacimiento   DATE,
        hashed_password    TEXT NOT NULL,
        pais               TEXT,
        estado             TEXT,
        genero             TEXT,
        seleccion_favorita INTEGER REFERENCES selecciones(id) ON DELETE SET NULL,
        jugador_favorito   TEXT,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stickers (
        id           SERIAL PRIMARY KEY,
        seleccion_id INTEGER NOT NULL REFERENCES selecciones(id) ON DELETE CASCADE,
        numero       INTEGER NOT NULL,
        tipo         TEXT NOT NULL CHECK (tipo IN ('jugador', 'escudo', 'alineacion')),
        posicion     TEXT,
        UNIQUE (seleccion_id, numero)
      );

      CREATE TABLE IF NOT EXISTS coleccion (
        id         SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        sticker_id INTEGER NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
        cantidad   INTEGER NOT NULL DEFAULT 1 CHECK (cantidad >= 0),
        UNIQUE (usuario_id, sticker_id)
      );
    `);

    // 2. Seed selecciones
    await client.query(`
      INSERT INTO selecciones (nombre, abreviatura, grupo) VALUES
        ('FIFA World Cup 2026', 'FWC', NULL),
        ('México',            'MEX', 'A'), ('Sudáfrica',       'RSA', 'A'), ('Corea del Sur',   'KOR', 'A'), ('República Checa', 'CZE', 'A'),
        ('Canadá',            'CAN', 'B'), ('Bosnia',          'BIH', 'B'), ('Catar',           'QAT', 'B'), ('Suiza',           'SUI', 'B'),
        ('Brasil',            'BRA', 'C'), ('Marruecos',       'MAR', 'C'), ('Haití',           'HAI', 'C'), ('Escocia',         'SCO', 'C'),
        ('Estados Unidos',    'USA', 'D'), ('Paraguay',        'PAR', 'D'), ('Australia',       'AUS', 'D'), ('Turquía',         'TUR', 'D'),
        ('Alemania',          'GER', 'E'), ('Curazao',         'CUW', 'E'), ('Costa de Marfil', 'CIV', 'E'), ('Ecuador',         'ECU', 'E'),
        ('Países Bajos',      'NED', 'F'), ('Japón',           'JPN', 'F'), ('Suecia',          'SWE', 'F'), ('Túnez',           'TUN', 'F'),
        ('Página Promo CC',   'CC',  'FX'),
        ('Bélgica',           'BEL', 'G'), ('Egipto',          'EGY', 'G'), ('Irán',            'IRN', 'G'), ('Nueva Zelanda',   'NZL', 'G'),
        ('España',            'ESP', 'H'), ('Uruguay',         'URU', 'H'), ('Arabia Saudita',  'KSA', 'H'), ('Cabo Verde',      'CPV', 'H'),
        ('Francia',           'FRA', 'I'), ('Senegal',         'SEN', 'I'), ('Irak',            'IRQ', 'I'), ('Noruega',         'NOR', 'I'),
        ('Argentina',         'ARG', 'J'), ('Austria',         'AUT', 'J'), ('Argelia',         'ALG', 'J'), ('Jordania',        'JOR', 'J'),
        ('Portugal',          'POR', 'K'), ('Colombia',        'COL', 'K'), ('Uzbekistán',      'UZB', 'K'), ('RD Congo',        'COD', 'K'),
        ('Inglaterra',        'ENG', 'L'), ('Croacia',         'CRO', 'L'), ('Panamá',          'PAN', 'L'), ('Ghana',           'GHA', 'L')
      ON CONFLICT (abreviatura) DO UPDATE
        SET nombre = EXCLUDED.nombre, grupo = EXCLUDED.grupo;
    `);

    // 3. Seed stickers para todas las selecciones
    const { rows: selecciones } = await client.query('SELECT id, abreviatura FROM selecciones');

    const values = [];
    const params = [];
    let i = 1;
    for (const sel of selecciones) {
      const template = sel.abreviatura === 'FWC' ? fwcTemplate
                     : sel.abreviatura === 'CC'  ? ccTemplate
                     : stickerTemplate;
      for (const t of template) {
        values.push(`($${i++}, $${i++}, $${i++}, $${i++})`);
        params.push(sel.id, t.numero, t.tipo, t.posicion);
      }
    }

    await client.query(`
      INSERT INTO stickers (seleccion_id, numero, tipo, posicion)
      VALUES ${values.join(', ')}
      ON CONFLICT (seleccion_id, numero) DO NOTHING
    `, params);

    console.log(`DB lista — ${selecciones.length} selecciones`);
  } finally {
    client.release();
  }
}

export default pool;
