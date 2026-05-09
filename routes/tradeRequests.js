import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// Crear solicitud (la manda persona A tras confirmar su lado)
router.post('/', async (req, res) => {
  const { to_user_id, trades } = req.body;
  if (!to_user_id || !Array.isArray(trades) || trades.length === 0)
    return res.status(400).json({ error: 'Datos inválidos' });
  try {
    const { rows } = await pool.query(`
      INSERT INTO trade_requests (from_user_id, to_user_id, trades)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [req.userId, parseInt(to_user_id), JSON.stringify(trades)]);
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solicitudes pendientes del usuario autenticado
router.get('/pending', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT tr.id, tr.from_user_id, u.nombre AS from_name, tr.trades, tr.created_at
      FROM trade_requests tr
      JOIN usuarios u ON u.id = tr.from_user_id
      WHERE tr.to_user_id = $1 AND tr.status = 'pending'
      ORDER BY tr.created_at DESC
    `, [req.userId]);

    if (rows.length === 0) return res.json([]);

    const stickerIds = new Set();
    for (const row of rows) {
      for (const t of row.trades) {
        stickerIds.add(t.give_sticker_id);
        stickerIds.add(t.receive_sticker_id);
      }
    }

    const { rows: stickers } = await pool.query(`
      SELECT s.id, sel.abreviatura AS country_abrv, s.numero AS number, s.tipo AS type
      FROM stickers s
      JOIN selecciones sel ON sel.id = s.seleccion_id
      WHERE s.id = ANY($1)
    `, [Array.from(stickerIds)]);

    const stickerMap = Object.fromEntries(stickers.map(s => [s.id, s]));

    res.json(rows.map(row => ({
      id:           row.id,
      from_user_id: row.from_user_id,
      from_name:    row.from_name,
      created_at:   row.created_at,
      trades:       row.trades.map(t => ({
        give:    stickerMap[t.give_sticker_id],
        receive: stickerMap[t.receive_sticker_id],
      })),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Aceptar solicitud: actualiza la colección de B y marca como aceptada
router.post('/:id/accept', async (req, res) => {
  const tradeId = parseInt(req.params.id);
  if (isNaN(tradeId)) return res.status(400).json({ error: 'ID inválido' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT trades FROM trade_requests WHERE id = $1 AND to_user_id = $2 AND status = 'pending'`,
      [tradeId, req.userId]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    for (const { give_sticker_id, receive_sticker_id } of rows[0].trades) {
      // B entrega: reduce en 1 (mínimo 0) y borra si llega a 0
      await client.query(`
        INSERT INTO coleccion (usuario_id, sticker_id, cantidad)
        VALUES ($1, $2, 0)
        ON CONFLICT (usuario_id, sticker_id)
        DO UPDATE SET cantidad = GREATEST(coleccion.cantidad - 1, 0)
      `, [req.userId, give_sticker_id]);
      await client.query(
        `DELETE FROM coleccion WHERE usuario_id = $1 AND sticker_id = $2 AND cantidad = 0`,
        [req.userId, give_sticker_id]
      );

      // B recibe: suma 1
      await client.query(`
        INSERT INTO coleccion (usuario_id, sticker_id, cantidad)
        VALUES ($1, $2, 1)
        ON CONFLICT (usuario_id, sticker_id)
        DO UPDATE SET cantidad = coleccion.cantidad + 1
      `, [req.userId, receive_sticker_id]);
    }

    await client.query(`UPDATE trade_requests SET status = 'accepted' WHERE id = $1`, [tradeId]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Rechazar solicitud
router.post('/:id/reject', async (req, res) => {
  const tradeId = parseInt(req.params.id);
  if (isNaN(tradeId)) return res.status(400).json({ error: 'ID inválido' });
  try {
    await pool.query(
      `UPDATE trade_requests SET status = 'rejected' WHERE id = $1 AND to_user_id = $2`,
      [tradeId, req.userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
