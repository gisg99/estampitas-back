import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [
      { rows: [{ total }] },
      { rows: [{ collected }] },
      { rows: [{ duplicates }] },
      { rows: byCountry },
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM stickers'),

      pool.query(
        'SELECT COUNT(*)::int AS collected FROM coleccion WHERE usuario_id = $1 AND cantidad >= 1',
        [req.userId]
      ),

      pool.query(
        'SELECT COALESCE(SUM(cantidad - 1), 0)::int AS duplicates FROM coleccion WHERE usuario_id = $1 AND cantidad > 1',
        [req.userId]
      ),

      pool.query(`
        SELECT sel.abreviatura AS country_abrv,
               COUNT(s.id)::int              AS total,
               COUNT(c.sticker_id)::int      AS collected
        FROM stickers s
        JOIN selecciones sel ON sel.id = s.seleccion_id
        LEFT JOIN coleccion c ON c.sticker_id = s.id AND c.usuario_id = $1 AND c.cantidad >= 1
        GROUP BY sel.abreviatura
        ORDER BY sel.abreviatura
      `, [req.userId]),
    ]);

    res.json({ total, collected, missing: total - collected, duplicates, byCountry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
