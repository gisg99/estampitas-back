import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const { rows: users } = await pool.query(
      'SELECT nombre FROM usuarios WHERE id = $1', [userId]
    );
    if (!users.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { rows: stickers } = await pool.query(`
      SELECT s.id            AS sticker_id,
             sel.abreviatura AS country_abrv,
             s.numero        AS number,
             COALESCE(c.cantidad, 0) AS quantity
      FROM stickers s
      JOIN selecciones sel ON sel.id = s.seleccion_id
      LEFT JOIN coleccion c ON c.sticker_id = s.id AND c.usuario_id = $1
      ORDER BY sel.abreviatura, s.numero
    `, [userId]);

    res.json({ name: users[0].nombre, stickers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
