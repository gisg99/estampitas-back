import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id,
             u.nombre            AS name,
             u.correo            AS email,
             u.fecha_nacimiento,
             u.pais,
             u.estado,
             u.genero,
             u.jugador_favorito,
             u.seleccion_favorita,
             sel.nombre          AS seleccion_favorita_nombre,
             sel.abreviatura     AS seleccion_favorita_abrv
      FROM usuarios u
      LEFT JOIN selecciones sel ON sel.id = u.seleccion_favorita
      WHERE u.id = $1
    `, [req.userId]);
    res.json(rows[0] ?? null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  const { name, email, fecha_nacimiento, pais, estado, genero, jugador_favorito, seleccion_favorita } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE usuarios
      SET nombre             = $1,
          correo             = $2,
          fecha_nacimiento   = $3,
          pais               = $4,
          estado             = $5,
          genero             = $6,
          jugador_favorito   = $7,
          seleccion_favorita = $8
      WHERE id = $9
      RETURNING id, nombre AS name, correo AS email,
                fecha_nacimiento, pais, estado, genero, jugador_favorito, seleccion_favorita
    `, [
      name, email,
      fecha_nacimiento || null,
      pais, estado, genero,
      jugador_favorito,
      seleccion_favorita ? parseInt(seleccion_favorita) : null,
      req.userId,
    ]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
