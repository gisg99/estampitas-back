-- Sección FIFA World Cup (va antes de todas las selecciones)
INSERT INTO selecciones (nombre, abreviatura, grupo) VALUES
  ('FIFA World Cup 2026', 'FWC', NULL)
ON CONFLICT (abreviatura) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      grupo  = NULL;
