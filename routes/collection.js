import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id,
             sel.abreviatura          AS country_abrv,
             s.numero                 AS number,
             s.tipo                   AS type,
             COALESCE(s.posicion, s.tipo) AS content,
             COALESCE(c.cantidad, 0)  AS quantity
      FROM stickers s
      JOIN selecciones sel ON sel.id = s.seleccion_id
      LEFT JOIN coleccion c ON c.sticker_id = s.id AND c.usuario_id = $1
      ORDER BY sel.abreviatura, s.numero
    `, [req.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const { rows: exists } = await pool.query('SELECT id FROM stickers WHERE id = $1', [id]);
    if (!exists.length) return res.status(404).json({ error: 'Sticker no encontrado' });

    const { rows } = await pool.query(`
      INSERT INTO coleccion (usuario_id, sticker_id, cantidad)
      VALUES ($1, $2, 1)
      ON CONFLICT (usuario_id, sticker_id)
      DO UPDATE SET cantidad = coleccion.cantidad + 1
      RETURNING cantidad
    `, [req.userId, id]);
    res.json({ sticker_id: id, quantity: rows[0].cantidad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/', async (req, res) => {
  const changes = req.body?.changes;
  if (!Array.isArray(changes) || changes.length === 0)
    return res.json({ ok: true });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const { id, quantity } of changes) {
      const sid = parseInt(id);
      const qty = parseInt(quantity);
      if (isNaN(sid) || isNaN(qty) || qty < 0) continue;
      if (qty === 0) {
        await client.query(
          'DELETE FROM coleccion WHERE usuario_id = $1 AND sticker_id = $2',
          [req.userId, sid]
        );
      } else {
        await client.query(`
          INSERT INTO coleccion (usuario_id, sticker_id, cantidad)
          VALUES ($1, $2, $3)
          ON CONFLICT (usuario_id, sticker_id)
          DO UPDATE SET cantidad = $3
        `, [req.userId, sid, qty]);
      }
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const id       = parseInt(req.params.id);
  const quantity = parseInt(req.body.quantity);
  if (isNaN(id))                       return res.status(400).json({ error: 'ID inválido' });
  if (isNaN(quantity) || quantity < 0) return res.status(400).json({ error: 'Cantidad inválida' });
  try {
    if (quantity === 0) {
      await pool.query(
        'DELETE FROM coleccion WHERE usuario_id = $1 AND sticker_id = $2',
        [req.userId, id]
      );
    } else {
      await pool.query(`
        INSERT INTO coleccion (usuario_id, sticker_id, cantidad)
        VALUES ($1, $2, $3)
        ON CONFLICT (usuario_id, sticker_id)
        DO UPDATE SET cantidad = $3
      `, [req.userId, id, quantity]);
    }
    res.json({ sticker_id: id, quantity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const { rows } = await pool.query(
      'SELECT cantidad FROM coleccion WHERE usuario_id = $1 AND sticker_id = $2',
      [req.userId, id]
    );

    if (!rows.length || rows[0].cantidad === 0)
      return res.json({ sticker_id: id, quantity: 0 });

    if (rows[0].cantidad === 1) {
      await pool.query(
        'DELETE FROM coleccion WHERE usuario_id = $1 AND sticker_id = $2',
        [req.userId, id]
      );
      res.json({ sticker_id: id, quantity: 0 });
    } else {
      const { rows: updated } = await pool.query(`
        UPDATE coleccion SET cantidad = cantidad - 1
        WHERE usuario_id = $1 AND sticker_id = $2
        RETURNING cantidad
      `, [req.userId, id]);
      res.json({ sticker_id: id, quantity: updated[0].cantidad });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
