import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { JWT_SECRET, JWT_EXPIRES } from '../config.js';

const router = Router();

router.post('/signup', async (req, res) => {
  const {
    nombre, correo, password,
    fecha_nacimiento, genero,
    seleccion_favorita, jugador_favorito,
  } = req.body;

  if (!nombre || !correo || !password || !fecha_nacimiento || !genero)
    return res.status(400).json({ error: 'Nombre, correo, contraseña, fecha de nacimiento y género son requeridos' });

  try {
    const { rows: exists } = await pool.query(
      'SELECT id FROM usuarios WHERE correo = $1', [correo]
    );
    if (exists.length) return res.status(409).json({ error: 'Ese correo ya está registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(`
      INSERT INTO usuarios (nombre, correo, hashed_password, fecha_nacimiento, genero, seleccion_favorita, jugador_favorito)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nombre, correo
    `, [
      nombre, correo, hashed,
      fecha_nacimiento || null,
      genero || null,
      seleccion_favorita ? parseInt(seleccion_favorita) : null,
      jugador_favorito || null,
    ]);

    const user = rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.status(201).json({ token, user: { id: user.id, name: user.nombre, email: user.correo } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password)
    return res.status(400).json({ error: 'Correo y contraseña son requeridos' });

  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, correo, hashed_password FROM usuarios WHERE correo = $1', [correo]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.hashed_password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, user: { id: user.id, name: user.nombre, email: user.correo } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
