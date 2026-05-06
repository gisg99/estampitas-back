import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const connectionString = readFileSync(join(__dirname, 'db.txt'), 'utf8').trim();

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// CC: 14 cromos promocionales, numerados 1-14
const ccTemplate = Array.from({ length: 14 }, (_, i) => ({
  numero:   i + 1,
  tipo:     'jugador',
  posicion: null,
}));

// FWC: numero 0 → escudo (logo), numeros 1-19 → jugador (9 al inicio + 11 al final = 20 total)
const fwcTemplate = [
  { numero: 0, tipo: 'escudo', posicion: null },
  ...Array.from({ length: 19 }, (_, i) => ({ numero: i + 1, tipo: 'jugador', posicion: null })),
];

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
    await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS genero TEXT`);

    // Seed stickers for all selecciones — batch insert (1 query total)
    const { rows: selecciones } = await client.query('SELECT id, abreviatura FROM selecciones');
    if (selecciones.length === 0) return;

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

    console.log(`DB lista — ${selecciones.length} selecciones, ${selecciones.length * stickerTemplate.length} stickers`);
  } finally {
    client.release();
  }
}

export default pool;
